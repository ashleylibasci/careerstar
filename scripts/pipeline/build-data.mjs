// CareerStar offline data pipeline (Story 2.1).
// Joins the curated occupation seed (BLS growth/pay + interest tags) with the
// real Eloundou "GPTs are GPTs" AI-exposure scores, keyed by O*NET-SOC code,
// and emits the committed data/data.json the runtime scorer reads.
//
// Run: node scripts/pipeline/build-data.mjs   (or: npm run build:data)
// Deterministic: same inputs -> same output. No network at build time.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// Fixed so the output is reproducible run-to-run.
const GENERATED = "2026-07-08";

const seed = JSON.parse(
  readFileSync(join(__dirname, "occupations.seed.json"), "utf8"),
);
const csv = readFileSync(
  join(ROOT, "data", "sources", "eloundou_occ_level.csv"),
  "utf8",
);

// --- Parse the Eloundou CSV into a map: O*NET-SOC code -> beta exposure ---
const lines = csv.trim().split(/\r?\n/);
const header = lines[0].split(",");
const codeIdx = header.indexOf("O*NET-SOC Code");
const betaIdx = header.indexOf("dv_rating_beta");
if (codeIdx === -1 || betaIdx === -1) {
  throw new Error("Eloundou CSV header changed — expected O*NET-SOC Code + dv_rating_beta");
}

const exposureByCode = new Map();
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",");
  const code = cols[codeIdx];
  const beta = Number(cols[betaIdx]);
  if (code && Number.isFinite(beta)) exposureByCode.set(code, beta);
}

// --- Join ---
const occupations = [];
const unmatched = [];
for (const occ of seed.occupations) {
  const beta = exposureByCode.get(occ.code);
  if (beta === undefined) {
    unmatched.push(`${occ.code} (${occ.title})`);
    continue;
  }
  occupations.push({
    code: occ.code,
    title: occ.title,
    growthPct: occ.growthPct,
    medianPay: occ.medianPay,
    aiExposure: Math.round(beta * 1000) / 1000, // 0–1, higher = more AI-exposed
    skills: occ.skills,
  });
}

const data = {
  meta: {
    generated: GENERATED,
    occupationCount: occupations.length,
    note: "MVP curated STEM/CS/quant/finance dataset. BLS growth/pay are approximate ~2023 OOH figures pending verification; skills are MVP interest tags pending O*NET vectors.",
    sources: {
      aiExposure: {
        name: "Eloundou et al. 2023, \"GPTs are GPTs\" (occupation-level, dv_rating_beta = E1 + 0.5·E2)",
        license: "MIT",
        url: "https://github.com/openai/GPTs-are-GPTs",
      },
      growthAndPay: {
        name: "U.S. BLS Occupational Outlook Handbook (~2023 edition)",
        license: "Public domain",
        note: "Curated for the MVP occupation set; verify against current BLS.",
      },
    },
  },
  occupations,
};

writeFileSync(
  join(ROOT, "data", "data.json"),
  JSON.stringify(data, null, 2) + "\n",
  "utf8",
);

console.log(`Wrote data/data.json — ${occupations.length} occupations joined.`);
if (unmatched.length) {
  console.warn(`⚠ ${unmatched.length} unmatched (no AI-exposure row, skipped):`);
  unmatched.forEach((u) => console.warn(`  - ${u}`));
} else {
  console.log("All seed occupations joined successfully.");
}
