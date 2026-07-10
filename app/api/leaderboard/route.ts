import data from "@/data/data.json";
import type { Occupation } from "@/lib/scorer/types";
import { computeScores } from "@/lib/scorer/scorer";
import { percentileOf, starsFromPercentile } from "@/lib/scorer/rating";
import { fieldName } from "@/lib/fields";
import { educationShort, roi } from "@/lib/education";

const dataset = (data as { occupations: Occupation[] }).occupations;

// Neutral viability score for every occupation (no interests → fit is even),
// computed once at module load.
const scored = computeScores(
  dataset,
  [],
  dataset.map((o) => o.code),
);
const byCode = new Map(dataset.map((o) => [o.code, o]));
const allScores = scored.map((r) => r.score);

const list = scored
  .map((r) => {
    const o = byCode.get(r.code)!;
    const group = o.code.slice(0, 2);
    return {
      code: r.code,
      title: r.path,
      score: r.score,
      stars: starsFromPercentile(percentileOf(r.score, allScores)),
      moat: o.moat ?? null,
      growthPct: o.growthPct,
      medianPay: o.medianPay,
      aiExposurePct: r.breakdown?.aiExposurePct ?? Math.round(o.aiExposure * 100),
      resilience: r.breakdown?.resilience ?? 100 - r.components.risk,
      group,
      field: fieldName(group),
      education: o.education ?? "",
      educationShort: educationShort(o.education),
      roi: roi(o.medianPay, o.education),
    };
  })
  .sort((a, b) => b.score - a.score);

// GET /api/leaderboard — every career with a neutral viability score + metrics.
export function GET() {
  return Response.json({ careers: list });
}
