// CareerStar Ratings Dataset — the open-data export.
// Every occupation with its default-weight rating, stars, moat, and all five
// model scores, as a single CSV anyone can download and audit ("check my math").
//
// Run: node scripts/pipeline/build-dataset.mjs   (or: npm run build:dataset)
// Deterministic: derived entirely from data/data.json + the documented models.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeScores } from "../../lib/scorer/scorer.ts";
import { modelScores, modelConsensus, MODELS } from "../../lib/scorer/models.ts";
import { percentileOf, starsFromPercentile } from "../../lib/scorer/rating.ts";
import { fieldName } from "../../lib/fields.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const data = JSON.parse(readFileSync(join(ROOT, "data", "data.json"), "utf8"));
const stats = { skillMean: data.meta.skillMean, skillStd: data.meta.skillStd };
const occupations = data.occupations;
const scored = computeScores(occupations, [], occupations.map((o) => o.code), undefined, stats);
const allScores = scored.map((r) => r.score);
const byCode = new Map(occupations.map((o) => [o.code, o]));

const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const modelCols = MODELS.map((m) => `model_${m.id}`);
const header = [
  "onet_soc_code", "title", "field", "score_default", "stars", "percentile",
  "moat", "moat_score", ...modelCols, "consensus_mean", "consensus_spread",
  "growth_pct_2024_34", "median_pay_usd", "ai_exposure", "typical_education",
  "skill_vector_estimated",
];

const rows = scored
  .slice()
  .sort((a, b) => b.score - a.score)
  .map((r) => {
    const o = byCode.get(r.code);
    const pct = percentileOf(r.score, allScores);
    const models = modelScores(r, o.moatScore);
    const c = modelConsensus(models);
    return [
      r.code, o.title, fieldName(r.code.slice(0, 2)), r.score,
      starsFromPercentile(pct), Math.round(pct), o.moat ?? "", o.moatScore ?? "",
      ...MODELS.map((m) => models[m.id]), c.mean, c.spread,
      o.growthPct, o.medianPay, o.aiExposure, o.education ?? "",
      o.skillVectorEstimated ? "true" : "false",
    ].map(esc).join(",");
  });

const csv = [header.join(","), ...rows].join("\n") + "\n";
writeFileSync(join(ROOT, "public", "careerstar-ratings.csv"), csv, "utf8");
console.log(`Wrote public/careerstar-ratings.csv — ${rows.length} careers, ${header.length} columns.`);
