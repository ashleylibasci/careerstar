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
  /** The career path this card scores. */
  path: string;
  /** Overall risk-adjusted viability score (0–100). */
  score: number;
  components: ScoreComponents;
  /** Short human note (e.g. a placeholder caveat, later the explanation). */
  note: string;
}

export interface ScoreResponse {
  input: string;
  results: ScoreResult[];
  /** True while scoring is the Story 1.3 placeholder, not the real model. */
  placeholder: boolean;
}
