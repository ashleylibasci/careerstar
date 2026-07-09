import type { Occupation, ScoreResult } from "./types.ts";
import { computeScores, WEIGHTS, type Weights } from "./scorer.ts";
import type { SkillStats } from "./skills.ts";

// Sensitivity analysis (the model's honesty check). CareerStar's weights are a
// deliberate modeling choice, not physics — so the fair question is: does the
// answer SURVIVE reasonable disagreement about them? We jitter every weight ±20%
// over a deterministic 3-level grid ({0.8, 1.0, 1.2} × baseline)^6 = 729 weight
// vectors, re-rank the compared careers under each, and report how stable each
// career's rank is. A ranking that holds across 729 weightings is robust; one
// that flips on a nudge is fragile — and we say which it is.
//
// Deterministic: a fixed grid, no randomness → same inputs, same report.

const JITTER = 0.2;
const LEVELS = [1 - JITTER, 1, 1 + JITTER];
const WEIGHT_KEYS: (keyof Weights)[] = [
  "wGrowth", "wPay", "wExposure", "wVolatility", "gamma", "alpha",
];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export interface CandidateStability {
  code: string;
  path: string;
  baselineScore: number;
  baselineRank: number;
  /** Best (lowest) and worst (highest) rank seen across all weight scenarios. */
  rankBest: number;
  rankWorst: number;
  /** Fraction of scenarios (0–1) in which this career kept its baseline rank. */
  heldRankPct: number;
  scoreMin: number;
  scoreMax: number;
}

export interface SensitivityReport {
  trials: number;
  jitterPct: number;
  candidates: CandidateStability[];
  /** Plain-English headline about the top pick's robustness. */
  headline: string;
}

/** All 3^6 = 729 jittered weight vectors from a baseline (deterministic grid). */
function weightGrid(base: Weights): Weights[] {
  const out: Weights[] = [];
  const rec = (i: number, acc: Partial<Weights>) => {
    if (i === WEIGHT_KEYS.length) { out.push(acc as Weights); return; }
    const key = WEIGHT_KEYS[i];
    for (const lv of LEVELS) rec(i + 1, { ...acc, [key]: clamp01(base[key] * lv) });
  };
  rec(0, {});
  return out;
}

function ranksByScore(results: ScoreResult[]): Map<string, number> {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const m = new Map<string, number>();
  sorted.forEach((r, i) => m.set(r.code, i + 1));
  return m;
}

/**
 * Rank-stability of a compared career set under ±20% weight jitter.
 * @param candidateCodes the exact set the user is comparing (ranked among itself).
 */
export function analyzeSensitivity(
  dataset: Occupation[],
  interests: string[],
  candidateCodes: string[],
  stats?: SkillStats,
  baseWeights?: Partial<Weights>,
): SensitivityReport {
  const base: Weights = { ...WEIGHTS, ...baseWeights };
  const baseline = computeScores(dataset, interests, candidateCodes, base, stats);
  const baseRank = ranksByScore(baseline);
  const baseScore = new Map(baseline.map((r) => [r.code, r.score]));

  const acc = new Map<string, { held: number; rankMin: number; rankMax: number; sMin: number; sMax: number }>();
  for (const r of baseline) {
    acc.set(r.code, { held: 0, rankMin: Infinity, rankMax: -Infinity, sMin: Infinity, sMax: -Infinity });
  }

  const grid = weightGrid(base);
  for (const w of grid) {
    const trial = computeScores(dataset, interests, candidateCodes, w, stats);
    const rank = ranksByScore(trial);
    for (const r of trial) {
      const a = acc.get(r.code)!;
      const rk = rank.get(r.code)!;
      if (rk === baseRank.get(r.code)) a.held++;
      a.rankMin = Math.min(a.rankMin, rk);
      a.rankMax = Math.max(a.rankMax, rk);
      a.sMin = Math.min(a.sMin, r.score);
      a.sMax = Math.max(a.sMax, r.score);
    }
  }

  const candidates: CandidateStability[] = baseline
    .map((r) => {
      const a = acc.get(r.code)!;
      return {
        code: r.code,
        path: r.path,
        baselineScore: baseScore.get(r.code)!,
        baselineRank: baseRank.get(r.code)!,
        rankBest: a.rankMin,
        rankWorst: a.rankMax,
        heldRankPct: a.held / grid.length,
        scoreMin: a.sMin,
        scoreMax: a.sMax,
      };
    })
    .sort((x, y) => x.baselineRank - y.baselineRank);

  const top = candidates[0];
  const pct = top ? Math.round(top.heldRankPct * 100) : 0;
  const headline = !top
    ? "No careers to test."
    : candidates.length === 1
      ? `Scored across ${grid.length} weightings (±${JITTER * 100}%): ${top.path} ranged ${top.scoreMin}–${top.scoreMax}.`
      : pct >= 80
        ? `Robust: your top pick (${top.path}) held #1 in ${pct}% of ${grid.length} weightings (±${JITTER * 100}%).`
        : `Sensitive: the #1 pick changes under ${100 - pct}% of ±${JITTER * 100}% weightings — the top careers are close.`;

  return { trials: grid.length, jitterPct: JITTER * 100, candidates, headline };
}
