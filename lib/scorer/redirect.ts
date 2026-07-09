import type { Occupation, ScoreResult } from "./types";

// Redirect logic (Story 3.2). For a low-scoring path, find a higher-scoring
// occupation that is "adjacent" — i.e. shares the most skills with it — so the
// suggestion reuses the user's existing strengths instead of sending them
// somewhere unrelated. Deterministic; no LLM.

/** A path scoring below this (0–100) gets a redirect. */
export const VIABILITY_THRESHOLD = 45;

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

/**
 * Find a stronger, skill-adjacent alternative to `low`.
 * @param low        the low-scoring result
 * @param allScored  every dataset occupation scored for this same user
 * @param occByCode  code → occupation (for skills)
 */
export function findRedirect(
  low: ScoreResult,
  allScored: ScoreResult[],
  occByCode: Map<string, Occupation>,
): ScoreResult["redirect"] {
  const lowOcc = occByCode.get(low.code);
  if (!lowOcc) return undefined;

  const better = allScored
    .filter((r) => r.code !== low.code && r.score > low.score)
    .map((r) => ({ r, sim: jaccard(lowOcc.skills, occByCode.get(r.code)?.skills ?? []) }))
    // Prefer skill-adjacent first, then higher score.
    .sort((x, y) => y.sim - x.sim || y.r.score - x.r.score);

  const pick = better[0];
  if (!pick) return undefined;

  const pickOcc = occByCode.get(pick.r.code);
  const shared = lowOcc.skills.filter((s) =>
    (pickOcc?.skills ?? []).map((t) => t.toLowerCase()).includes(s.toLowerCase()),
  );
  const reason = shared.length
    ? `Scores higher and reuses your ${shared.slice(0, 2).join(" & ")} strengths.`
    : `Scores higher on the same interests.`;

  return { code: pick.r.code, title: pick.r.path, score: pick.r.score, reason };
}
