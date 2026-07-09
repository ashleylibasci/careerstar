import data from "@/data/data.json";
import type { Occupation, ScoreResponse } from "@/lib/scorer/types";
import { computeScores } from "@/lib/scorer/scorer";
import { parseInput } from "@/lib/scorer/parse";
import { findRedirect, VIABILITY_THRESHOLD } from "@/lib/scorer/redirect";
import { plainVerdict } from "@/lib/scorer/verdict";
import { explainResults } from "@/lib/explain/explain";
import { validateInput } from "@/lib/security/limits";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

// POST /api/score  — body: { text: string }
// Real scoring (Stories 2.3 + 2.4): parse free text → occupations + interests,
// score them with the deterministic model, return sorted cards.
const dataset = (data as { occupations: Occupation[] }).occupations;

export async function POST(request: Request) {
  // Rate limit before any work (abuse / cost control).
  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bodyObj = body as { text?: unknown; riskPriority?: unknown } | null;
  const validation = validateInput(bodyObj?.text);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: validation.status });
  }
  const text = validation.text;

  // Optional priority slider (0 = ignore AI risk … 1 = weigh it heavily) → gamma.
  const rp =
    typeof bodyObj?.riskPriority === "number"
      ? Math.max(0, Math.min(1, bodyObj.riskPriority))
      : undefined;
  const weights = rp !== undefined ? { gamma: 0.2 + 0.8 * rp } : undefined;

  const { candidateCodes, interests } = parseInput(text, dataset);

  // Which occupations to score: the ones the user named, else those that
  // overlap their stated interests (so they always get a grounded answer).
  let codes = candidateCodes;
  if (codes.length === 0) {
    const lower = new Set(interests.map((s) => s.toLowerCase()));
    codes = dataset
      .filter((o) => o.skills.some((s) => lower.has(s.toLowerCase())))
      .map((o) => o.code);
  }

  const scored = computeScores(dataset, interests, codes, weights)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const occByCode = new Map(dataset.map((o) => [o.code, o]));

  // Score the whole dataset once, to source redirects for low-scoring paths.
  const allScored = computeScores(dataset, interests, dataset.map((o) => o.code), weights);

  // LLM plain-English explanation (falls back to a factual note if no key / error).
  const explanations = await explainResults(scored, occByCode, interests);

  const results = scored.map((r) => {
    const occ = occByCode.get(r.code)!;
    const redirect =
      r.score < VIABILITY_THRESHOLD
        ? findRedirect(r, allScored, occByCode)
        : undefined;
    // LLM sentence when available, else a plain-English verdict (never a stat dump).
    return {
      ...r,
      note: explanations.get(r.code) ?? plainVerdict(occ, r.components),
      redirect,
    };
  });

  const response: ScoreResponse = {
    input: text.trim(),
    results,
    placeholder: false,
    message:
      results.length === 0
        ? "Couldn't match your text to a career yet. Try naming one — e.g. “data science”, “software engineering”, or “quant”."
        : undefined,
  };

  return Response.json(response, { status: 200 });
}
