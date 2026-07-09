// CareerStar offline data pipeline (full dataset).
// Joins the real BLS Employment Projections (2024–2034) with the real Eloundou
// "GPTs are GPTs" AI-exposure scores AND the real O*NET skill-importance
// vectors, keyed by SOC / O*NET-SOC code, and emits the committed
// data/data.json the runtime scorer reads.
//
// Run: node scripts/pipeline/build-data.mjs   (or: npm run build:data)
// Deterministic: same inputs -> same output. No network at build time.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CAPABILITY_ELEMENTS, SKILL_ELEMENTS, KNOWLEDGE_ELEMENTS } from "../../lib/scorer/skills.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const GENERATED = "2026-07-09";

// --- quote-aware CSV parsing (fields may contain commas inside quotes) ---
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cols = parseCsvLine(l);
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i]));
    return row;
  });
}

// --- SOC major group (first 2 digits) -> broad interest/skill tags ---
const GROUP_TAGS = {
  "11": ["management", "leadership", "business", "strategy"],
  "13": ["business", "finance", "analysis", "detail"],
  "15": ["technology", "data", "math", "programming"],
  "17": ["engineering", "design", "math", "technical"],
  "19": ["science", "research", "analysis"],
  "21": ["helping", "people", "social", "communication"],
  "23": ["law", "writing", "research", "argument"],
  "25": ["teaching", "education", "people", "communication"],
  "27": ["creative", "design", "art", "media", "writing"],
  "29": ["healthcare", "medicine", "care", "people", "science"],
  "31": ["healthcare", "care", "support", "people"],
  "33": ["protective", "service", "physical"],
  "35": ["culinary", "hospitality", "service", "hands-on"],
  "37": ["service", "hands-on"],
  "39": ["people", "service", "care"],
  "41": ["sales", "communication", "people"],
  "43": ["organization", "office", "detail", "administrative"],
  "45": ["hands-on", "outdoors", "agriculture"],
  "47": ["construction", "trades", "hands-on"],
  "49": ["trades", "mechanical", "hands-on", "repair"],
  "51": ["production", "manufacturing", "hands-on"],
  "53": ["transportation", "hands-on", "logistics"],
};

const STOPWORDS = new Set([
  "and", "the", "for", "with", "all", "other", "of", "in", "or", "except",
  "workers", "worker", "including", "not", "listed", "elsewhere", "n.e.c", "nec",
  "assistants", "assistant", "managers", "manager", "occupations", "first", "line",
  "specialists", "specialist", "operators", "operator", "general", "than", "their",
]);

// --- load sources ---
const bls = parseCsv(readFileSync(join(ROOT, "data", "sources", "bls_employment_projections.csv"), "utf8"));
const eloundou = parseCsv(readFileSync(join(ROOT, "data", "sources", "eloundou_occ_level.csv"), "utf8"));

const exposureByCode = new Map();
for (const row of eloundou) {
  const code = row["O*NET-SOC Code"];
  const beta = Number(row["dv_rating_beta"]);
  if (code && Number.isFinite(beta)) exposureByCode.set(code, beta);
}

// --- O*NET 29.0 capability vectors: Skills + Knowledge importance (IM) ---
// Load both tab-delimited files into code -> { element -> importance(1–5) },
// keeping only the Importance scale and our canonical elements. Skills and
// Knowledge share a "Mathematics" element; we tag the knowledge one so both
// dimensions in CAPABILITY_ELEMENTS get filled. Then a helper resolves a SOC to
// a 68-d vector: exact O*NET-SOC match if present, else the mean over every
// detailed O*NET-SOC sharing the SOC prefix (many O*NET codes roll up to one SOC).
const SKILL_SET = new Set(SKILL_ELEMENTS);
const KNOW_SET = new Set(KNOWLEDGE_ELEMENTS);
const onetByCode = new Map(); // onetSoc -> Map(taggedElement -> IM)

function loadOnet(file, keep, tag) {
  const raw = readFileSync(join(ROOT, "data", "sources", file), "utf8");
  for (const line of raw.trim().split(/\r?\n/).slice(1)) {
    const [code, , element, scale, value] = line.split("\t");
    if (scale !== "IM" || !keep.has(element)) continue;
    const v = Number(value);
    if (!Number.isFinite(v)) continue;
    if (!onetByCode.has(code)) onetByCode.set(code, new Map());
    onetByCode.get(code).set(tag(element), v);
  }
}
// Knowledge elements are tagged "K:" so knowledge-Mathematics stays distinct from skill-Mathematics.
loadOnet("onet_skills.txt", SKILL_SET, (e) => e);
loadOnet("onet_knowledge.txt", KNOW_SET, (e) => `K:${e}`);

// Element key for each CAPABILITY_ELEMENTS slot (first 35 skills as-is, last 33 knowledge tagged).
const CAP_KEYS = CAPABILITY_ELEMENTS.map((name, j) =>
  j < SKILL_ELEMENTS.length ? name : `K:${name}`,
);

/** 68-d importance vector (CAPABILITY_ELEMENTS order) for a SOC, or null if O*NET has no data. */
function skillVectorForSoc(soc) {
  const prefix = `${soc}.`;
  const matches = [];
  const exact = onetByCode.get(`${soc}.00`);
  if (exact) matches.push(exact);
  else for (const [code, m] of onetByCode) if (code.startsWith(prefix)) matches.push(m);
  if (matches.length === 0) return null;
  return CAP_KEYS.map((key) => {
    let sum = 0, n = 0;
    for (const m of matches) if (m.has(key)) { sum += m.get(key); n++; }
    return n === 0 ? 0 : Math.round((sum / n) * 100) / 100;
  });
}

function titleTags(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

const occupations = [];
let skippedNoExposure = 0;
let skippedNoData = 0;
let matchedOnet = 0;

for (const row of bls) {
  const socRaw = row["Occupation Code"] || "";
  const socMatch = socRaw.match(/(\d{2}-\d{4})/);
  if (!socMatch) continue;
  const soc = socMatch[1];
  const onetCode = `${soc}.00`;

  const beta = exposureByCode.get(onetCode);
  if (beta === undefined) { skippedNoExposure++; continue; }

  const growthPct = Number(row["Employment Percent Change, 2024-2034"]);
  const pay = Number(String(row["Median Annual Wage 2024"]).replace(/[,\s]/g, ""));
  if (!Number.isFinite(growthPct) || !Number.isFinite(pay) || pay <= 0) { skippedNoData++; continue; }

  // BLS title field packs alternate titles after the main one, "*"-separated.
  const parts = String(row["Occupation Title"] || soc)
    .split("*")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const title = parts[0] || soc;
  const aliases = parts.slice(1).filter((a) => a.length > 2).slice(0, 15);

  const group = soc.slice(0, 2);
  const tags = Array.from(new Set([...(GROUP_TAGS[group] || []), ...titleTags(title)]));

  const education = String(row["Typical Entry-Level Education"] || "").trim();
  const skillVector = skillVectorForSoc(soc);
  if (skillVector) matchedOnet++;

  occupations.push({
    code: onetCode,
    title,
    aliases,
    growthPct: Math.round(growthPct * 10) / 10,
    medianPay: Math.round(pay),
    aiExposure: Math.round(beta * 1000) / 1000,
    skills: tags,
    skillVector,
    education,
  });
}

occupations.sort((a, b) => a.title.localeCompare(b.title));

// --- market statistics for distinctiveness-weighted FIT ---
// Per skill, the mean and std of importance across every occupation that has an
// O*NET vector. The scorer z-scores an occupation's vector against these so that
// UBIQUITOUS skills (high mean, everyone has them) count for little and
// DISTINCTIVE strengths dominate fit. Without this, cosine over raw importance is
// dominated by the common skills and barely discriminates (verified empirically).
const withVec = occupations.filter((o) => o.skillVector);
const skillMean = CAPABILITY_ELEMENTS.map((_, j) => {
  const s = withVec.reduce((a, o) => a + o.skillVector[j], 0);
  return Math.round((s / withVec.length) * 1000) / 1000;
});
const skillStd = CAPABILITY_ELEMENTS.map((_, j) => {
  const m = skillMean[j];
  const v = withVec.reduce((a, o) => a + (o.skillVector[j] - m) ** 2, 0) / withVec.length;
  return Math.round(Math.sqrt(v) * 1000) / 1000;
});

// --- validation: is AI exposure just a proxy for decline? (construct validity) ---
// If exposure merely restated low growth, the risk adjustment would be redundant.
// We report the correlation between the two INDEPENDENT inputs (Eloundou exposure
// vs BLS projected growth). Near-zero ⇒ exposure carries distinct information and
// "exposure ≠ displacement" is literally true in the data.
function correlations(xs, ys) {
  const n = xs.length;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs), my = mean(ys);
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
  const pearson = cov / Math.sqrt(vx * vy);
  const rankOf = (a) => { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); idx.forEach(([, i], k) => (r[i] = k)); return r; };
  const [rx, ry] = [rankOf(xs), rankOf(ys)];
  const p = correlationsHelper(rx, ry);
  return { pearson: Math.round(pearson * 1000) / 1000, spearman: Math.round(p * 1000) / 1000 };
}
function correlationsHelper(xs, ys) {
  const n = xs.length, mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs), my = mean(ys);
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
  return cov / Math.sqrt(vx * vy);
}
const expo = occupations.map((o) => o.aiExposure);
const grow = occupations.map((o) => o.growthPct);
const { pearson, spearman } = correlations(expo, grow);
const byExpo = [...occupations].sort((a, b) => a.aiExposure - b.aiExposure);
const q = (seg) => Math.round((seg.reduce((s, o) => s + o.growthPct, 0) / seg.length) * 10) / 10;
const n4 = occupations.length / 4;
const exposureQuartileGrowth = [0, 1, 2, 3].map((i) => q(byExpo.slice(i * n4, (i + 1) * n4)));

const data = {
  meta: {
    generated: GENERATED,
    occupationCount: occupations.length,
    validation: {
      note: "AI exposure (Eloundou) vs BLS projected growth — two independent inputs. Near-zero correlation ⇒ exposure is not a decline proxy; the risk axis carries distinct information.",
      exposureGrowthPearson: pearson,
      exposureGrowthSpearman: spearman,
      exposureQuartileGrowthPct: exposureQuartileGrowth,
    },
    skillMean,
    skillStd,
    note: "Full dataset from BLS Employment Projections 2024-2034 joined with Eloundou AI-exposure and O*NET 29.0 importance ratings. `skills` are broad keyword tags (search/labels); `skillVector` is the 68-d O*NET capability vector (35 Skills + 33 Knowledge) used for distinctiveness-weighted FIT. `skillMean`/`skillStd` are the per-dimension market statistics.",
    skillElements: CAPABILITY_ELEMENTS,
    sources: {
      growthAndPay: {
        name: "U.S. BLS Employment Projections 2024-2034 (Occupation data)",
        license: "Public domain",
      },
      aiExposure: {
        name: 'Eloundou et al. 2023, "GPTs are GPTs" (occupation-level, dv_rating_beta)',
        license: "MIT",
        url: "https://github.com/openai/GPTs-are-GPTs",
      },
      skills: {
        name: "O*NET 29.0 Database — Skills (Importance scale), U.S. DOL/ETA",
        license: "CC BY 4.0 (O*NET attribution required)",
        url: "https://www.onetcenter.org/database.html",
      },
    },
  },
  occupations,
};

writeFileSync(join(ROOT, "data", "data.json"), JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Wrote data/data.json — ${occupations.length} occupations.`);
console.log(`  O*NET skill vectors: ${matchedOnet}/${occupations.length} matched.`);
console.log(`  skipped: ${skippedNoExposure} no AI-exposure match, ${skippedNoData} missing growth/pay.`);
