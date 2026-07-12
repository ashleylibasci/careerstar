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
  compute: (x: ModelInput) => number;
}

const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

export const MODELS: RatingModel[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Risk-adjusted return — AI risk discounts the market reward, then fit blends in. The headline model.",
    formula: "100·[α·(Return·(1−γ·Risk)) + (1−α)·Fit]",
    compute: (x) => clamp(x.standardScore),
  },
  {
    id: "momentum",
    name: "Growth maximalist",
    tagline: "Pure market momentum: growth + pay only. Deliberately ignores AI risk — 'the projections already price it in.'",
    formula: "0.5·growth + 0.5·pay",
    compute: (x) => clamp(0.5 * x.growthRank + 0.5 * x.payRank),
  },
  {
    id: "defensive",
    name: "Defensive",
    tagline: "Moat first: in an AI shock, survival beats upside. Defensibility and resilience dominate; reward is secondary.",
    formula: "0.5·moat + 0.3·resilience + 0.2·pay",
    compute: (x) =>
      clamp(0.5 * (x.moatScore != null ? x.moatScore * 100 : x.resilience) + 0.3 * x.resilience + 0.2 * x.payRank),
  },
  {
    id: "sharpe",
    name: "Sharpe-style",
    tagline: "Efficiency: reward per unit of risk, as a ratio — a high-return career must also be low-risk to score high.",
    formula: "100·Return / (Return + Risk)",
    compute: (x) => {
      const ret = 0.5 * x.growthRank + 0.5 * x.payRank;
      const risk = 100 - x.resilience;
      return ret + risk === 0 ? 50 : clamp((100 * ret) / (ret + risk));
    },
  },
  {
    id: "equal",
    name: "Naive 1/N",
    tagline: "The control: an equal-weight average of everything. If a clever model can't beat this, that's worth knowing.",
    formula: "(growth + pay + resilience + fit) / 4",
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
