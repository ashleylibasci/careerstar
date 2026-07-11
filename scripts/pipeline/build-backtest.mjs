// The temporal back-test: if CareerStar's model had existed in 2014, would it
// have flagged the careers that actually declined by 2024?
//
// Inputs:
//   · data/sources/bls_projections_2014_24.csv — the 2014–24 BLS projections
//     vintage (recovered from the Internet Archive's June-2016 snapshot of
//     BLS Table 1.2; BLS blocks scripted downloads of live files).
//   · data/sources/bls_employment_projections.csv — today's EP file, whose
//     BASE YEAR ("Employment 2024") is the realized ground truth.
//   · data/data.json — today's exposure + pay (see honesty notes below).
//
// Honesty notes (also disclosed on /methodology):
//   · 2015 wages aren't in the archived table, so pay percentiles use today's
//     pay ranking as a proxy (occupational pay ORDER is highly persistent);
//     a growth-only variant is computed alongside to show the proxy's effect.
//   · AI exposure is measured ~2023 and applied retrospectively; 2014–24 was
//     a pre-LLM decade, so exposure SHOULD carry little signal here — that is
//     itself a finding to report, not hide.
//
// Run: node scripts/pipeline/build-backtest.mjs   (npm run build:backtest)
// Output: data/backtest.json (metrics + named hits/misses).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// --- tiny CSV reader (quote-aware) ---
function parseCsvLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function readCsv(file) {
  const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const c = parseCsvLine(l);
    return Object.fromEntries(header.map((h, i) => [h, c[i]]));
  });
}
const num = (v) => { const n = Number(String(v ?? "").replace(/[,\s]/g, "")); return Number.isFinite(n) ? n : null; };

// --- stats helpers ---
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
function spearman(xs, ys) {
  const rank = (a) => {
    const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(a.length);
    idx.forEach(([, i], k) => (r[i] = k));
    return r;
  };
  const [rx, ry] = [rank(xs), rank(ys)];
  const [mx, my] = [mean(rx), mean(ry)];
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < xs.length; i++) { cov += (rx[i] - mx) * (ry[i] - my); vx += (rx[i] - mx) ** 2; vy += (ry[i] - my) ** 2; }
  return cov / Math.sqrt(vx * vy);
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// --- load the three sources ---
const vintage = readCsv(join(ROOT, "data", "sources", "bls_projections_2014_24.csv"));
const current = readCsv(join(ROOT, "data", "sources", "bls_employment_projections.csv"));
const dataJson = JSON.parse(readFileSync(join(ROOT, "data", "data.json"), "utf8"));

// realized 2024 employment (thousands) by SOC, from today's EP base year
const actual2024 = new Map();
for (const row of current) {
  const m = String(row["Occupation Code"] || "").match(/(\d{2}-\d{4})/);
  const emp = num(row["Employment 2024"]);
  if (m && emp !== null) actual2024.set(m[1], emp);
}

// today's exposure + pay by SOC (from data.json, code = soc + ".00")
const occToday = new Map(dataJson.occupations.map((o) => [o.code.slice(0, 7), o]));

// --- join the 2014 universe to ground truth ---
const rows = [];
let noActual = 0, noToday = 0;
for (const v of vintage) {
  const soc = v.soc_code;
  const emp14 = num(v.emp_2014_thousands);
  const emp24proj = num(v.emp_2024_projected_thousands);
  if (!soc || emp14 === null || emp24proj === null || emp14 <= 0) continue;
  const actual = actual2024.get(soc);
  if (actual === undefined) { noActual++; continue; }
  const today = occToday.get(soc);
  if (!today) { noToday++; continue; }
  rows.push({
    soc,
    title: v.title,
    emp14,
    projectedPct: ((emp24proj - emp14) / emp14) * 100,
    realizedPct: ((actual - emp14) / emp14) * 100,
    exposure: today.aiExposure,
    medianPayToday: today.medianPay,
  });
}

// --- score the 2014 market with today's model (default weights, neutral fit) ---
const ranker = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => { let c = 0; for (const x of sorted) if (x <= v) c++; return c / sorted.length; };
};
const growthRank = ranker(rows.map((r) => r.projectedPct));
const payRank = ranker(rows.map((r) => r.medianPayToday));
const W = { wGrowth: 0.5, wPay: 0.5, wExposure: 0.7, wVolatility: 0.3, gamma: 0.6, alpha: 0.7 };
for (const r of rows) {
  const g = growthRank(r.projectedPct);
  const p = payRank(r.medianPayToday);
  const risk = W.wExposure * clamp01(r.exposure) + W.wVolatility * clamp01(1 - g);
  const score = (mode) => {
    const ret = mode === "growthOnly" ? g : W.wGrowth * g + W.wPay * p;
    return Math.round(100 * (W.alpha * (ret * (1 - W.gamma * risk)) + (1 - W.alpha) * 0.5));
  };
  r.score2014 = score("full");
  r.score2014GrowthOnly = score("growthOnly");
}

// --- metrics ---
const decliners = rows.filter((r) => r.realizedPct < 0);
const growers = rows.filter((r) => r.realizedPct >= 0);
const scoreCut = [...rows.map((r) => r.score2014)].sort((a, b) => a - b)[Math.floor(rows.length / 3)]; // bottom-tercile cut
const flaggedDecliners = decliners.filter((r) => r.score2014 <= scoreCut);
const falseAlarms = rows
  .filter((r) => r.score2014 <= scoreCut && r.realizedPct > 10)
  .sort((a, b) => b.realizedPct - a.realizedPct);
const misses = decliners
  .filter((r) => r.score2014 > [...rows.map((x) => x.score2014)].sort((a, b) => a - b)[Math.floor((2 * rows.length) / 3)])
  .sort((a, b) => a.realizedPct - b.realizedPct);

const backtest = {
  meta: {
    generated: "2026-07-10",
    vintageSource:
      "BLS Employment Projections 2014–24, Table 1.2 — recovered from the Internet Archive snapshot of 2016-06-05 (BLS blocks scripted downloads of live files).",
    groundTruth: "Realized 2024 employment = base year of the current BLS EP 2024–34 file.",
    joined: rows.length,
    unjoined: { noActual2024: noActual, noTodayData: noToday },
    caveats: [
      "2015 wages absent from the archived table → pay percentile uses today's pay ranking as a proxy (occupational pay order is highly persistent); the growth-only variant shows the proxy's effect.",
      "AI exposure is measured ~2023 and applied retrospectively; 2014–24 was a pre-LLM decade, so exposure is expected to carry little signal here.",
      "SOC-2010 (2014 vintage) joined to SOC-2018 (today) on matching codes only — reorganized occupations drop out.",
    ],
  },
  metrics: {
    spearmanScoreVsRealized: Math.round(spearman(rows.map((r) => r.score2014), rows.map((r) => r.realizedPct)) * 1000) / 1000,
    spearmanScoreGrowthOnlyVsRealized:
      Math.round(spearman(rows.map((r) => r.score2014GrowthOnly), rows.map((r) => r.realizedPct)) * 1000) / 1000,
    spearmanBlsProjectionVsRealized:
      Math.round(spearman(rows.map((r) => r.projectedPct), rows.map((r) => r.realizedPct)) * 1000) / 1000,
    spearmanExposureVsRealized:
      Math.round(spearman(rows.map((r) => r.exposure), rows.map((r) => r.realizedPct)) * 1000) / 1000,
    decliners: decliners.length,
    declinersFlaggedBottomTercile: flaggedDecliners.length,
    declinerHitRatePct: Math.round((flaggedDecliners.length / decliners.length) * 100),
    baseRateBottomTercilePct: 33,
    medianScoreDecliners: median(decliners.map((r) => r.score2014)),
    medianScoreGrowers: median(growers.map((r) => r.score2014)),
  },
  biggestMisses: misses.slice(0, 8).map((r) => ({ soc: r.soc, title: r.title, score2014: r.score2014, realizedPct: Math.round(r.realizedPct * 10) / 10 })),
  falseAlarms: falseAlarms.slice(0, 8).map((r) => ({ soc: r.soc, title: r.title, score2014: r.score2014, realizedPct: Math.round(r.realizedPct * 10) / 10 })),
};

writeFileSync(join(ROOT, "data", "backtest.json"), JSON.stringify(backtest, null, 2) + "\n", "utf8");
console.log(`Back-test: ${rows.length} occupations joined (${noActual} lacked actual 2024, ${noToday} lacked today's data).`);
console.log(JSON.stringify(backtest.metrics, null, 1));
