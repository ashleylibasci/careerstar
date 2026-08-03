import data from "@/data/data.json";
import type { Occupation, ScoreResponse, ScoreResult } from "@/lib/scorer/types";
import { computeScores } from "@/lib/scorer/scorer";
import { analyzeSensitivity } from "@/lib/scorer/sensitivity";
import { parseInput } from "@/lib/scorer/parse";
import { findRedirect, VIABILITY_THRESHOLD } from "@/lib/scorer/redirect";
import { plainVerdict } from "@/lib/scorer/verdict";
import { starsFromPercentile, percentileOf, bullsAndBears } from "@/lib/scorer/rating";
import { modelScores, MODELS } from "@/lib/scorer/models";
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
    model?: unknown;
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

  // Judge switch: re-score the headline — and the whole curve — under one of
  // the five rating models. The signals are identical; only the combination
  // rule changes, so score, percentile, stars, and band all move together and
  // can never tell two different stories on one card.
  const rawModel = bodyObj?.model;
  const modelId =
    typeof rawModel === "string" && MODELS.some((m) => m.id === rawModel) ? rawModel : "standard";
  const applyModel = (r: ScoreResult): number =>
    modelId === "standard"
      ? r.score
      : (modelScores(r, occByCode.get(r.code)?.moatScore)[modelId] ?? r.score);
  const shown =
    modelId === "standard"
      ? scored
      : scored.map((r) => ({ ...r, score: applyModel(r) })).sort((a, b) => b.score - a.score);
  const curve = modelId === "standard" ? allScores : allScored.map(applyModel);

  // LLM plain-English explanation (falls back to a factual note if no key / error).
  const explanations = await explainResults(shown, occByCode, interests);

  const results = shown.map((r) => {
    const occ = occByCode.get(r.code)!;
    // Redirects reason about the Standard score's threshold; other judges
    // rank without them rather than borrow a threshold that isn't theirs.
    const redirect =
      modelId === "standard" && r.score < VIABILITY_THRESHOLD
        ? findRedirect(r, allScored, occByCode, skillStats)
        : undefined;
    // LLM sentence when available, else a plain-English verdict (never a stat dump).
    const pct = percentileOf(r.score, curve);
    return {
      ...r,
      note:
        explanations.get(r.code) ??
        plainVerdict(
          occ,
          r.components,
          interests.length > 0,
          r.breakdown ? r.breakdown.aiExposurePct / 100 : undefined,
        ),
      noteSource: (explanations.has(r.code) ? "llm" : "fallback") as "llm" | "fallback",
      redirect,
      percentile: Math.round(pct),
      stars: starsFromPercentile(pct),
      moat: occ.moat,
      models: modelScores(r, occ.moatScore),
      ...bullsAndBears(r),
    };
  });

  // Robustness: does the ranking survive ±20% weight jitter? Only meaningful
  // for the Standard judge — the rivals don't use these weights at all.
  const sensitivity =
    scored.length >= 1 && modelId === "standard"
      ? analyzeSensitivity(dataset, interests, scored.map((r) => r.code), skillStats, weights)
      : undefined;

  const response: ScoreResponse = {
    input: text.trim(),
    results,
    placeholder: false,
    sensitivity,
    model: modelId,
    fieldMax: curve.length ? Math.max(...curve) : undefined,
    message:
      results.length === 0
        ? careerCodes.length > 0
          ? "None of those career codes are in the rated set. Try searching by name instead."
          : "Couldn't match your text to a career yet. Try naming one — e.g. “data science”, “software engineering”, or “quant”."
        : undefined,
  };

  return Response.json(response, { status: 200 });
}
