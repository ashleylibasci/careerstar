// CareerStar offline data pipeline (full dataset).
// Joins the real BLS Employment Projections (2024–2034) with the real Eloundou
// "GPTs are GPTs" AI-exposure scores, keyed by SOC / O*NET-SOC code, and emits
// the committed data/data.json the runtime scorer reads.
//
// Run: node scripts/pipeline/build-data.mjs   (or: npm run build:data)
// Deterministic: same inputs -> same output. No network at build time.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const GENERATED = "2026-07-08";

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

function cleanTitle(raw) {
  // BLS titles append alternate titles after wide whitespace / "*"; keep the head.
  return raw.split(/\s{2,}|\s\*/)[0].replace(/\s+/g, " ").trim();
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

  const title = cleanTitle(row["Occupation Title"] || soc);
  const group = soc.slice(0, 2);
  const tags = Array.from(new Set([...(GROUP_TAGS[group] || []), ...titleTags(title)]));

  occupations.push({
    code: onetCode,
    title,
    growthPct: Math.round(growthPct * 10) / 10,
    medianPay: Math.round(pay),
    aiExposure: Math.round(beta * 1000) / 1000,
    skills: tags,
  });
}

occupations.sort((a, b) => a.title.localeCompare(b.title));

const data = {
  meta: {
    generated: GENERATED,
    occupationCount: occupations.length,
    note: "Full dataset from BLS Employment Projections 2024-2034 joined with Eloundou AI-exposure. Interest tags derived from SOC major group + title keywords (not O*NET skill vectors).",
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
    },
  },
  occupations,
};

writeFileSync(join(ROOT, "data", "data.json"), JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Wrote data/data.json — ${occupations.length} occupations.`);
console.log(`  skipped: ${skippedNoExposure} no AI-exposure match, ${skippedNoData} missing growth/pay.`);
