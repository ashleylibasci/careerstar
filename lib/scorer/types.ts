// Shared score types — the contract between the scoring layer and the UI.
// Story 1.3 fills these with a placeholder; Epic 2 swaps in the real model
// without changing this shape.

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
