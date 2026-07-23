// The career sky: project every occupation's 68-d capability vector (35 O*NET
// skills + 33 knowledge areas, z-scored against the labor market — the same
// space the fit score and redirect already use) down to 2D, so the whole
// market can be drawn as a night sky where careers cluster into constellations.
//
// Method: UMAP with a FIXED seed — and the choice is measured, not vibes.
// PCA was tried first (deterministic, hyperparameter-free, linear) and FAILED
// the honesty gate: PC1+PC2 explain only 48.5% of variance, just 19.3% of each
// career's 10 nearest 68-d neighbors survive into 2D, and same-field
// nearest-neighbor adjacency collapses from 67% (68-d) to 28% (2D). A sky that
// loses the neighborhoods is decoration. Both candidates' metrics are computed
// below and PCA's are kept in the output for comparison, disclosed on /sky.
// UMAP caveats we accept and disclose: distances BETWEEN constellations are
// not meaningful (only local neighborhoods are), and the layout depends on the
// seed + hyperparameters recorded here.
//
// "You are here" at runtime does NOT pretend to invert UMAP: a user's interest
// vector is placed at the similarity-weighted centroid of its nearest careers'
// 2D positions (weights = capability-space cosine, the same metric the fit
// score uses) — honest, and labeled as such on the page.
//
// Run: node scripts/pipeline/build-sky.mjs   (npm run build:sky)
// Output: data/sky.json (per-career 2D coords + honesty metrics).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { UMAP } from "umap-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const data = JSON.parse(readFileSync(join(ROOT, "data", "data.json"), "utf8"));
const { skillMean, skillStd } = data.meta;
const occs = data.occupations.filter((o) => Array.isArray(o.skillVector) && o.skillVector.length === skillMean.length);
const N = occs.length;
const D = skillMean.length;

// --- z-score each vector against the market (same normalization as the scorer) ---
const Z = occs.map((o) => o.skillVector.map((v, i) => (v - skillMean[i]) / (skillStd[i] || 1)));

// Center (z-scores are near-centered already; make it exact so PCA is proper).
const mean = new Array(D).fill(0);
for (const row of Z) for (let i = 0; i < D; i++) mean[i] += row[i] / N;
const X = Z.map((row) => row.map((v, i) => v - mean[i]));

// --- covariance matrix (68×68) ---
const C = Array.from({ length: D }, () => new Array(D).fill(0));
for (const row of X)
  for (let i = 0; i < D; i++) {
    const ri = row[i];
    for (let j = i; j < D; j++) C[i][j] += (ri * row[j]) / (N - 1);
  }
for (let i = 0; i < D; i++) for (let j = 0; j < i; j++) C[i][j] = C[j][i];

const totalVar = C.reduce((s, _, i) => s + C[i][i], 0);

// --- top components by power iteration with deflation (deterministic init) ---
function powerIteration(M, seed) {
  let v = Array.from({ length: D }, (_, i) => Math.sin(seed + i + 1)); // fixed, non-degenerate init
  for (let iter = 0; iter < 500; iter++) {
    const w = M.map((row) => row.reduce((s, m, j) => s + m * v[j], 0));
    const n = Math.hypot(...w);
    v = w.map((x) => x / n);
  }
  const Mv = M.map((row) => row.reduce((s, m, j) => s + m * v[j], 0));
  const eigenvalue = v.reduce((s, x, i) => s + x * Mv[i], 0);
  return { v, eigenvalue };
}
function deflate(M, v, lambda) {
  return M.map((row, i) => row.map((m, j) => m - lambda * v[i] * v[j]));
}

const pc1 = powerIteration(C, 1);
const pc2 = powerIteration(deflate(C, pc1.v, pc1.eigenvalue), 2);

const projectPCA = (row) => [
  row.reduce((s, v, i) => s + v * pc1.v[i], 0),
  row.reduce((s, v, i) => s + v * pc2.v[i], 0),
];
const Ppca = X.map(projectPCA);

// --- UMAP with a fixed seed (mulberry32 PRNG -> fully reproducible) ---
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const UMAP_PARAMS = { nNeighbors: 15, minDist: 0.12, seed: 20260722 };
const umap = new UMAP({
  nComponents: 2,
  nNeighbors: UMAP_PARAMS.nNeighbors,
  minDist: UMAP_PARAMS.minDist,
  random: mulberry32(UMAP_PARAMS.seed),
});
const P = umap.fit(X);

// --- honesty metrics ---
const varPct = [pc1.eigenvalue / totalVar, pc2.eigenvalue / totalVar].map((x) => Math.round(x * 1000) / 10);

// Neighborhood preservation: of each career's 10 nearest neighbors in the full
// 68-d space, how many are still among its 10 nearest in the 2D sky?
function knn(rows, k, dist) {
  return rows.map((_, a) => {
    const ds = rows.map((_, b) => (a === b ? Infinity : dist(rows[a], rows[b])));
    return ds
      .map((d, idx) => [d, idx])
      .sort((x, y) => x[0] - y[0])
      .slice(0, k)
      .map(([, idx]) => idx);
  });
}
const euclid = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
};
const K = 10;
const nnHi = knn(X, K, euclid);
const group = (o) => o.code.slice(0, 2);
const sameGroupRate = (nn) =>
  Math.round((occs.reduce((s, o, i) => s + (group(occs[nn[i][0]]) === group(o) ? 1 : 0), 0) / N) * 1000) / 10;

function embeddingMetrics(embedding) {
  const nnLo = knn(embedding, K, euclid);
  let overlap = 0;
  for (let i = 0; i < N; i++) {
    const lo = new Set(nnLo[i]);
    overlap += nnHi[i].filter((j) => lo.has(j)).length / K;
  }
  return {
    neighborPreservationPct: Math.round((overlap / N) * 1000) / 10,
    sameGroupNearestPct: sameGroupRate(nnLo),
  };
}

const mUmap = embeddingMetrics(P);
const mPca = embeddingMetrics(Ppca);
const sameGroupHi = sameGroupRate(nnHi); // the 68-d ceiling

// Normalize coords to [0,1] with a small margin for rendering.
const xs = P.map((p) => p[0]);
const ys = P.map((p) => p[1]);
const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
const norm = (v, lo, hi) => (v - lo) / (hi - lo);

const stars = occs.map((o, i) => ({
  code: o.code,
  x: Math.round(norm(P[i][0], minX, maxX) * 10000) / 10000,
  y: Math.round(norm(P[i][1], minY, maxY) * 10000) / 10000,
}));

const out = {
  meta: {
    generated: new Date().toISOString().slice(0, 10),
    method:
      "UMAP (seeded, reproducible) on z-scored 68-d O*NET capability vectors (35 skills + 33 knowledge) — the same space the fit score and redirect use. Local neighborhoods are meaningful; distances between distant constellations are not.",
    careers: N,
    umapParams: UMAP_PARAMS,
    neighborK: K,
    umap: mUmap,
    // The rejected candidate, kept for the disclosure table on /sky:
    pcaRejected: { varianceExplainedPct: varPct, ...mPca },
    sameGroupNearestPct68d: sameGroupHi,
  },
  stars,
};

writeFileSync(join(ROOT, "data", "sky.json"), JSON.stringify(out));
console.log(
  `sky.json: ${N} careers · UMAP 10-NN preserved: ${mUmap.neighborPreservationPct}% (PCA ${mPca.neighborPreservationPct}%) · ` +
    `nearest-neighbor same-field: UMAP ${mUmap.sameGroupNearestPct}% vs PCA ${mPca.sameGroupNearestPct}% vs 68-d ceiling ${sameGroupHi}% · ` +
    `PCA variance explained ${varPct[0]}%+${varPct[1]}%`,
);
