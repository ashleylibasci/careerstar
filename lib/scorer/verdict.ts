import type { Occupation, ScoreComponents } from "./types";

// Human-readable meaning for a score (Wave 1 UX). Deterministic — works with
// no API key. The LLM explanation, when a key is present, can replace the
// plain verdict with something smoother; this guarantees the app is never a
// wall of bare numbers.

export type Tone = "strong" | "mixed" | "risky";

export function scoreBand(score: number): { label: string; tone: Tone } {
  if (score >= 65) return { label: "Strong", tone: "strong" };
  if (score >= 45) return { label: "Mixed", tone: "mixed" };
  return { label: "Risky", tone: "risky" };
}

/** A plain-English one-liner built from the numbers (no LLM needed). */
/** `hasInterests` — with no interests given, fit is a neutral 50 and a sentence
 *  about "your interests" would describe interests that don't exist; drop it. */
export function plainVerdict(occ: Occupation, c: ScoreComponents, hasInterests = true): string {
  const growth = `${occ.growthPct >= 0 ? "+" : ""}${occ.growthPct}%`;
  const prospects =
    c.return >= 65
      ? "Strong market prospects"
      : c.return >= 45
        ? "Decent prospects"
        : "Softer prospects";

  const exp = Math.round(occ.aiExposure * 100);
  const expClause =
    exp >= 70
      ? `high AI exposure (${exp}/100)`
      : exp >= 40
        ? `moderate AI exposure (${exp}/100)`
        : `low AI exposure (${exp}/100)`;

  const fitSentence = !hasInterests
    ? ""
    : c.fit >= 60
      ? " Fits your interests well."
      : c.fit >= 30
        ? " A partial fit for your interests."
        : " A stretch from your stated interests.";

  return `${prospects} — ${growth} projected growth, ${expClause}.${fitSentence}`;
}
