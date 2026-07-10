import { zNormalize, type SkillStats } from "./skills.ts";

// AI-moat rating — Morningstar's "economic moat," translated to careers.
// A moat = how DEFENSIBLE a career is against AI/automation pressure:
//
//   defensibility = wExp·(1 − aiExposure) + wDist·distinctiveness
//
//   · aiExposure       — Eloundou LLM-exposure (share of tasks a model could
//                        touch). Low exposure = shelter.
//   · distinctiveness  — how strong the career's DEFINING capabilities are vs
//                        the whole labor market: the mean of its top-5 z-scored
//                        O*NET capability dimensions, recentered so the market
//                        median (~+1.9σ) lands mid-scale. A career whose best
//                        skills are things everyone has (cashiering) scores ~0;
//                        one built on rare capabilities (surgery) scores ~1.
//
// Thresholds are calibrated on the real 730-occupation distribution to a
// Morningstar-like shape (~20% wide / ~50% narrow / ~30% none) and are fixed
// constants, not percentiles — so a career's moat doesn't change when the
// dataset grows. Like the score weights, all of this is an explicit modeling
// choice, documented on /methodology.

export type Moat = "wide" | "narrow" | "none";

export const MOAT_WEIGHTS = { wExp: 0.6, wDist: 0.4 };
export const MOAT_WIDE = 0.7;
export const MOAT_NARROW = 0.55;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Mean of the top-5 z-scored capability dimensions — the strength of the
 *  career's defining capabilities relative to the whole market. */
export function distinctiveness(vec: number[], stats: SkillStats): number {
  const z = zNormalize(vec, stats).sort((a, b) => b - a);
  return (z[0] + z[1] + z[2] + z[3] + z[4]) / 5;
}

/** Defensibility score, 0–1 (null when the career has no capability vector). */
export function moatScore(
  aiExposure: number,
  vec: number[] | null | undefined,
  stats: SkillStats,
): number | null {
  if (!vec) return null;
  const dist = clamp01((distinctiveness(vec, stats) - 1) / 2);
  return MOAT_WEIGHTS.wExp * (1 - clamp01(aiExposure)) + MOAT_WEIGHTS.wDist * dist;
}

export function moatRating(score: number | null): Moat | null {
  if (score === null) return null;
  if (score >= MOAT_WIDE) return "wide";
  if (score >= MOAT_NARROW) return "narrow";
  return "none";
}

export const MOAT_LABEL: Record<Moat, string> = {
  wide: "Wide moat",
  narrow: "Narrow moat",
  none: "No moat",
};

/** One-line, deterministic reason for the rating (mirrors the two inputs). */
export function moatReason(aiExposure: number, vec: number[] | null | undefined, stats: SkillStats): string {
  if (!vec) return "Not rated — no O*NET capability data.";
  const exp = Math.round(clamp01(aiExposure) * 100);
  const dist = clamp01((distinctiveness(vec, stats) - 1) / 2);
  const shelter = exp <= 35 ? "low AI exposure" : exp <= 60 ? "moderate AI exposure" : "high AI exposure";
  const skills = dist >= 0.6 ? "rare, defining capabilities" : dist >= 0.3 ? "a moderately distinctive skill profile" : "a widely shared skill profile";
  return `${shelter} (${exp}/100) + ${skills}`;
}
