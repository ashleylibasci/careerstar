import type { ScoreResponse } from "./types";

// PLACEHOLDER scorer (Story 1.3).
// Deterministic — the same input always produces the same output, with no
// randomness and no LLM. This exists only to prove the end-to-end path.
// Story 2.2 replaces this with the real data-grounded, risk-adjusted model.

function hash(s: string): number {
  // FNV-1a — deterministic string hash.
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function inRange(seed: number, min: number, max: number): number {
  return min + (seed % (max - min + 1));
}

export function placeholderScore(text: string): ScoreResponse {
  const clean = text.trim();
  const h = hash(clean);

  const score = inRange(h, 45, 88);
  const components = {
    return: inRange(h >>> 3, 40, 95),
    risk: inRange(h >>> 7, 20, 80),
    fit: inRange(h >>> 11, 50, 95),
  };

  const label = clean.length > 60 ? clean.slice(0, 57).trimEnd() + "…" : clean;

  return {
    input: clean,
    results: [
      {
        path: label || "Your input",
        score,
        components,
        note: "Placeholder score — the real data-grounded model isn't wired up yet (coming in Epic 2).",
      },
    ],
    placeholder: true,
  };
}
