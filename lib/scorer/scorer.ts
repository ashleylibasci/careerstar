import type { Occupation, ScoreResult } from "./types";

// CareerStar scoring model (Story 2.2).
//
// Each career is scored like a financial asset: expected RETURN vs. RISK,
// combined into a risk-adjusted value, then blended with personal FIT.
//
//   Return = wGrowth·growthRank + wPay·payRank         (0–1, percentile-normalized)
//   Risk   = wExposure·aiExposure + wVolatility·volatility
//   RAV    = Return · (1 − gamma·Risk)                 (risk-adjusted return)
//   Score  = 100 · [ alpha·RAV + (1−alpha)·Fit ]       (0–100)
//
// Pure and deterministic: same inputs → same output, no I/O, no randomness.
// The scorer is the single source of truth for every number (Architecture AD-2);
// an LLM never computes a score (AD-4).

/**
 * Model weights. These are explicit and documented on purpose — tuning them
 * is CareerStar's sensitivity analysis (e.g. raise `wPay` and finance climbs;
 * raise `gamma` and AI-exposed fields sink). Change here, and the whole model
 * shifts predictably.
 */
export const WEIGHTS = {
  /** Expected return: growth vs. pay. */
  wGrowth: 0.5,
  wPay: 0.5,
  /** Risk: AI exposure dominates; volatility is the constructed proxy. */
  wExposure: 0.7,
  wVolatility: 0.3,
  /** How hard risk discounts return (0–1). */
  gamma: 0.6,
  /** Market viability vs. personal fit. */
  alpha: 0.7,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Returns a function giving the percentile rank (0–1) of a value in `values`. */
function percentileRanker(values: number[]): (v: number) => number {
  const sorted = [...values].sort((a, b) => a - b);
  return (v: number) => {
    if (sorted.length <= 1) return 0.5;
    let count = 0;
    for (const x of sorted) if (x <= v) count++;
    return count / sorted.length;
  };
}

interface NormContext {
  growthRank: (v: number) => number;
  payRank: (v: number) => number;
}

export type Weights = typeof WEIGHTS;

/** Score a single occupation given the user's interests and a normalization context. */
export function computeScore(
  occ: Occupation,
  interests: string[],
  ctx: NormContext,
  w: Weights = WEIGHTS,
): ScoreResult {
  const growthScore = ctx.growthRank(occ.growthPct); // 0–1
  const payScore = ctx.payRank(occ.medianPay); // 0–1
  const ret = w.wGrowth * growthScore + w.wPay * payScore;

  const exposure = clamp01(occ.aiExposure);
  // Constructed volatility proxy: no public dataset exists, so a field
  // projected to shrink (low growth percentile) is treated as more volatile.
  const volatility = clamp01(1 - growthScore);
  const risk = w.wExposure * exposure + w.wVolatility * volatility;

  const rav = ret * (1 - w.gamma * risk); // risk-adjusted return, 0–1

  // Fit: fraction of the user's stated interests this occupation matches.
  const interestSet = new Set(interests.map((s) => s.toLowerCase()));
  let overlap = 0;
  for (const skill of occ.skills) if (interestSet.has(skill.toLowerCase())) overlap++;
  const fit =
    interests.length === 0 ? 0.5 : clamp01(overlap / interests.length);

  const score = 100 * (w.alpha * rav + (1 - w.alpha) * fit);

  // Uncertainty grows with AI exposure (more speculative) and low fit.
  const confidence = Math.round(
    Math.max(4, Math.min(12, 4 + 6 * exposure + (fit < 0.3 ? 3 : 0))),
  );

  return {
    code: occ.code,
    path: occ.title,
    score: Math.round(clamp01(score / 100) * 100),
    confidence,
    components: {
      return: Math.round(ret * 100),
      risk: Math.round(risk * 100),
      fit: Math.round(fit * 100),
    },
    note: "",
    breakdown: {
      growthPct: occ.growthPct,
      medianPay: occ.medianPay,
      aiExposurePct: Math.round(exposure * 100),
      growthRank: Math.round(growthScore * 100),
      payRank: Math.round(payScore * 100),
      resilience: 100 - Math.round(risk * 100),
      gamma: w.gamma,
      alpha: w.alpha,
    },
  };
}

/**
 * Score a set of candidate occupations against the full dataset.
 * The dataset is used to percentile-normalize growth and pay, so a score
 * always means "relative to every other career in the set."
 */
export function computeScores(
  dataset: Occupation[],
  interests: string[],
  candidateCodes: string[],
  weights?: Partial<Weights>,
): ScoreResult[] {
  const w: Weights = { ...WEIGHTS, ...weights };
  const ctx: NormContext = {
    growthRank: percentileRanker(dataset.map((o) => o.growthPct)),
    payRank: percentileRanker(dataset.map((o) => o.medianPay)),
  };
  const byCode = new Map(dataset.map((o) => [o.code, o]));

  const results: ScoreResult[] = [];
  for (const code of candidateCodes) {
    const occ = byCode.get(code);
    if (occ) results.push(computeScore(occ, interests, ctx, w));
  }
  return results;
}
