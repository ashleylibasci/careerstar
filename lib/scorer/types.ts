// Shared score types — the contract between the scoring layer and the UI.
// Story 1.3 fills these with a placeholder; Epic 2 swaps in the real model
// without changing this shape.

/** One occupation row from data/data.json (produced by the offline pipeline). */
export interface Occupation {
  /** O*NET-SOC code. */
  code: string;
  title: string;
  /** BLS 10-year projected employment growth, percent. */
  growthPct: number;
  /** BLS annual median wage, USD. */
  medianPay: number;
  /** AI/automation exposure, 0–1 (Eloundou β; higher = more exposed). */
  aiExposure: number;
  /** Interest/skill tags for fit scoring. */
  skills: string[];
  /** Alternate job titles (from BLS) — used for synonym search. */
  aliases?: string[];
  /** Typical entry-level education (BLS). */
  education?: string;
}

export interface ScoreComponents {
  /** Expected return: growth + pay (0–100). */
  return: number;
  /** Risk: AI/automation exposure + volatility (0–100). */
  risk: number;
  /** Fit: overlap with the user's stated interests/skills (0–100). */
  fit: number;
}

export interface ScoreResult {
  /** O*NET-SOC code of the scored occupation. */
  code: string;
  /** The career path this card scores. */
  path: string;
  /** Overall risk-adjusted viability score (0–100). */
  score: number;
  components: ScoreComponents;
  /** Uncertainty band (±) on the score — higher when the estimate is more speculative. */
  confidence?: number;
  /** Short human note (e.g. a placeholder caveat, later the explanation). */
  note: string;
  /** For a low-scoring path: a stronger, adjacent path that reuses the user's strengths. */
  redirect?: {
    code: string;
    title: string;
    score: number;
    reason: string;
  };
  /** The raw inputs + intermediate math behind the score (for the "why" drawer). */
  breakdown?: {
    growthPct: number;
    medianPay: number;
    aiExposurePct: number;
    growthRank: number;
    payRank: number;
    resilience: number;
    gamma: number;
    alpha: number;
  };
}

export interface ScoreResponse {
  input: string;
  results: ScoreResult[];
  /** True while scoring is the Story 1.3 placeholder, not the real model. */
  placeholder: boolean;
  /** Optional helper message, e.g. when no occupation could be matched. */
  message?: string;
}
