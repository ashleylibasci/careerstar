import data from "@/data/data.json";
import type { Occupation, ScoreResponse } from "@/lib/scorer/types";
import { computeScores } from "@/lib/scorer/scorer";
import { parseInput } from "@/lib/scorer/parse";

// POST /api/score  — body: { text: string }
// Real scoring (Stories 2.3 + 2.4): parse free text → occupations + interests,
// score them with the deterministic model, return sorted cards.
const dataset = (data as { occupations: Occupation[] }).occupations;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json(
      { error: "Please enter your interests and the paths you're weighing." },
      { status: 400 },
    );
  }

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

  const results = computeScores(dataset, interests, codes)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => {
      const occ = dataset.find((o) => o.code === r.code)!;
      const growth = `${occ.growthPct >= 0 ? "+" : ""}${occ.growthPct}% projected growth`;
      const exposure = `AI exposure ${Math.round(occ.aiExposure * 100)}/100`;
      return { ...r, note: `${growth} · ${exposure}` };
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
