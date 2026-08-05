import type { ScoreResult } from "./types.ts";

// Alternative rating models — model risk, made visible.
//
// The Standard score is ONE defensible way to combine the signals; these are
// four rivals, each a different PHILOSOPHY (not a weight tweak). All five read
// the same normalized signals (growth/pay percentiles, AI exposure, resilience,
// fit, moat), so differences in output are differences in worldview — and the
// SPREAD between models is information: agreement = conviction, disagreement =
// genuine uncertainty about how much AI risk should count.
//
// Every model is deterministic and documented on /methodology.

export interface ModelInput {
  /** Standard CareerStar score (0–100) — the multiplicative risk-discount model. */
  standardScore: number;
  growthRank: number; // 0–100 percentile
  payRank: number; // 0–100 percentile
  resilience: number; // 0–100 (inverse of risk)
  fit: number; // 0–100
  moatScore?: number | null; // 0–1 defensibility, when rated
}

export interface RatingModel {
  id: string;
  name: string;
  tagline: string;
  formula: string;
  /** What this judge sees that the others miss. */
  strengths: string;
  /** The blind spot you accept by choosing it. */
  caution: string;
  compute: (x: ModelInput) => number;
}

const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

export const MODELS: RatingModel[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "The headline model: reward (growth + pay), marked down by AI risk, blended with your fit.",
    formula: "100·[α·(Return·(1−γ·Risk)) + (1−α)·Fit]",
    strengths:
      "The balanced read — and the only model here that's been tested against a real decade of history (2014→2024).",
    caution:
      "Its weights are judgment calls — no dataset proves them right — which is exactly why the four rivals exist.",
    compute: (x) => clamp(x.standardScore),
  },
  {
    id: "momentum",
    name: "Growth optimist",
    tagline: "Growth + pay only. Deliberately ignores AI risk, betting the official forecasts already account for it.",
    formula: "0.5·growth + 0.5·pay",
    strengths:
      "The purest read of the official forecasts — and in the 2014→2024 test, the raw forecast was the single best predictor.",
    caution:
      "Blind to AI by design. A heavily exposed career with good growth numbers scores well right up until it doesn't.",
    compute: (x) => clamp(0.5 * x.growthRank + 0.5 * x.payRank),
  },
  {
    id: "defensive",
    name: "Defensive",
    tagline: "Safety first: if AI hits hard, surviving beats thriving. Shelter from AI counts most; reward is secondary.",
    formula: "0.5·moat + 0.3·resilience + 0.2·pay",
    strengths:
      "Built for the bad scenario — the only judge that scores how sheltered a career is from AI, so it catches safety the others ignore.",
    caution:
      "Punishes exposed-but-booming fields hard: it will underrate software developers in every future where AI disappoints.",
    compute: (x) =>
      clamp(0.5 * (x.moatScore != null ? x.moatScore * 100 : x.resilience) + 0.3 * x.resilience + 0.2 * x.payRank),
  },
  {
    id: "sharpe",
    name: "Efficiency",
    tagline: "Reward per unit of risk — a career must earn its risk to score high. (Investors call this a Sharpe ratio.)",
    formula: "100·Return / (Return + Risk)",
    strengths:
      "Flags high-reward careers whose risk is quietly outsized — something the other judges let slide.",
    caution:
      "Ratios flatter the timid — a low-reward, low-risk career can score 'efficient' while going nowhere.",
    compute: (x) => {
      const ret = 0.5 * x.growthRank + 0.5 * x.payRank;
      const risk = 100 - x.resilience;
      return ret + risk === 0 ? 50 : clamp((100 * ret) / (ret + risk));
    },
  },
  {
    id: "equal",
    name: "Plain average",
    tagline: "The baseline: a simple average of everything. If a clever model can't beat this, that's worth knowing.",
    formula: "(growth + pay + resilience + fit) / 4",
    strengths:
      "No opinions to be wrong about — just the bar every fancier model has to clear.",
    caution:
      "Counts every ingredient equally, which nobody actually believes — including it.",
    compute: (x) => clamp((x.growthRank + x.payRank + x.resilience + x.fit) / 4),
  },
];

/** Score one result under every model. */
export function modelScores(r: ScoreResult, moatScore?: number | null): Record<string, number> {
  const input: ModelInput = {
    standardScore: r.score,
    growthRank: r.breakdown?.growthRank ?? 50,
    payRank: r.breakdown?.payRank ?? 50,
    resilience: r.breakdown?.resilience ?? 100 - r.components.risk,
    fit: r.components.fit,
    moatScore,
  };
  const out: Record<string, number> = {};
  for (const m of MODELS) out[m.id] = m.compute(input);
  return out;
}

/** Consensus stats across models: mean and spread (max − min). */
export function modelConsensus(scores: Record<string, number>): { mean: number; spread: number } {
  const vals = Object.values(scores);
  if (vals.length === 0) return { mean: 0, spread: 0 };
  const mean = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const spread = Math.max(...vals) - Math.min(...vals);
  return { mean, spread };
}
