import data from "@/data/data.json";
import type { Occupation, ScoreResponse } from "@/lib/scorer/types";
import { computeScores } from "@/lib/scorer/scorer";
import { analyzeSensitivity } from "@/lib/scorer/sensitivity";
import { parseInput } from "@/lib/scorer/parse";
import { findRedirect, VIABILITY_THRESHOLD } from "@/lib/scorer/redirect";
import { plainVerdict } from "@/lib/scorer/verdict";
import { starsFromPercentile, percentileOf, bullsAndBears } from "@/lib/scorer/rating";
import { modelScores } from "@/lib/scorer/models";
import { explainResults } from "@/lib/explain/explain";
import { validateInput } from "@/lib/security/limits";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

// POST /api/score  — body: { text: string }
// Real scoring (Stories 2.3 + 2.4): parse free text → occupations + interests,
// score them with the deterministic model, return sorted cards.
const typed = data as {
  occupations: Occupation[];
  meta: { skillMean: number[]; skillStd: number[] };
};
const dataset = typed.occupations;
// Market statistics for distinctiveness-weighted O*NET fit (see lib/scorer/skills.ts).
const skillStats = { skillMean: typed.meta.skillMean, skillStd: typed.meta.skillStd };

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

  const bodyObj = body as {
    text?: unknown;
    careerCodes?: unknown;
    fieldGroups?: unknown;
    interests?: unknown;
    riskPriority?: unknown;
    weights?: unknown;
  } | null;

  const asStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 30) : [];

  const careerCodes = asStrings(bodyObj?.careerCodes);
  const fieldGroups = asStrings(bodyObj?.fieldGroups);
  const chipInterests = asStrings(bodyObj?.interests).map((s) => s.slice(0, 40));
  const rawText = typeof bodyObj?.text === "string" ? bodyObj.text : "";
  const hasStructured =
    careerCodes.length > 0 || fieldGroups.length > 0 || chipInterests.length > 0;

  // Text is validated only when it's the sole input; with chips it's optional.
  let text = "";
  if (rawText.trim().length > 0 || !hasStructured) {
    const validation = validateInput(bodyObj?.text);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: validation.status });
    }
    text = validation.text;
  }

  // Model-tuning weights (all clamped 0–1). Falls back to the legacy
  // riskPriority → gamma mapping for older clients.
  const ALLOWED_WEIGHTS = ["wGrowth", "wPay", "wExposure", "wVolatility", "gamma", "alpha"];
  let weights: Record<string, number> | undefined;
  const rawWeights = bodyObj?.weights;
  if (rawWeights && typeof rawWeights === "object") {
    const w: Record<string, number> = {};
    for (const k of ALLOWED_WEIGHTS) {
      const v = (rawWeights as Record<string, unknown>)[k];
      if (typeof v === "number" && Number.isFinite(v)) w[k] = Math.max(0, Math.min(1, v));
    }
    // AI-adoption scenario multiplier — not a 0–1 weight; clamped to a sane band.
    const adopt = (rawWeights as Record<string, unknown>).aiAdoption;
    if (typeof adopt === "number" && Number.isFinite(adopt)) w.aiAdoption = Math.max(0.3, Math.min(1.7, adopt));
    if (Object.keys(w).length) weights = w;
  }
  if (!weights && typeof bodyObj?.riskPriority === "number") {
    weights = { gamma: 0.2 + 0.8 * Math.max(0, Math.min(1, bodyObj.riskPriority)) };
  }

  const validCodes = new Set(dataset.map((o) => o.code));
  const parsed = text ? parseInput(text, dataset) : { candidateCodes: [], interests: [] };

  // Candidates: explicit career chips + every occupation in a chosen field +
  // whatever the free text named.
  const codeSet = new Set<string>();
  for (const c of careerCodes) if (validCodes.has(c)) codeSet.add(c);
  if (fieldGroups.length) {
    const groups = new Set(fieldGroups);
    for (const o of dataset) if (groups.has(o.code.slice(0, 2))) codeSet.add(o.code);
  }
  for (const c of parsed.candidateCodes) codeSet.add(c);

  const interests = Array.from(new Set([...chipInterests, ...parsed.interests]));

  // Which occupations to score: the chosen ones, else those overlapping the
  // stated interests (so interests-only input still yields a grounded answer).
  let codes = Array.from(codeSet);
  if (codes.length === 0) {
    const lower = new Set(interests.map((s) => s.toLowerCase()));
    codes = dataset
      .filter((o) => o.skills.some((s) => lower.has(s.toLowerCase())))
      .map((o) => o.code);
  }

  const scored = computeScores(dataset, interests, codes, weights, skillStats)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const occByCode = new Map(dataset.map((o) => [o.code, o]));

  // Score the whole dataset once, to source redirects AND the relative star curve.
  const allScored = computeScores(dataset, interests, dataset.map((o) => o.code), weights, skillStats);
  const allScores = allScored.map((r) => r.score);

  // LLM plain-English explanation (falls back to a factual note if no key / error).
  const explanations = await explainResults(scored, occByCode, interests);

  const results = scored.map((r) => {
    const occ = occByCode.get(r.code)!;
    const redirect =
      r.score < VIABILITY_THRESHOLD
        ? findRedirect(r, allScored, occByCode, skillStats)
        : undefined;
    // LLM sentence when available, else a plain-English verdict (never a stat dump).
    const pct = percentileOf(r.score, allScores);
    return {
      ...r,
      note: explanations.get(r.code) ?? plainVerdict(occ, r.components, interests.length > 0),
      noteSource: (explanations.has(r.code) ? "llm" : "fallback") as "llm" | "fallback",
      redirect,
      percentile: Math.round(pct),
      stars: starsFromPercentile(pct),
      moat: occ.moat,
      models: modelScores(r, occ.moatScore),
      ...bullsAndBears(r),
    };
  });

  // Robustness: does the ranking of the shown careers survive ±20% weight jitter?
  const sensitivity =
    scored.length >= 1
      ? analyzeSensitivity(dataset, interests, scored.map((r) => r.code), skillStats, weights)
      : undefined;

  const response: ScoreResponse = {
    input: text.trim(),
    results,
    placeholder: false,
    sensitivity,
    message:
      results.length === 0
        ? "Couldn't match your text to a career yet. Try naming one — e.g. “data science”, “software engineering”, or “quant”."
        : undefined,
  };

  return Response.json(response, { status: 200 });
}
