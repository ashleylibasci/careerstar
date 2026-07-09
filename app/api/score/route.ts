import { placeholderScore } from "@/lib/scorer/placeholder";

// POST /api/score
// Body: { text: string }
// Returns a ScoreResponse. Story 1.3: placeholder scoring only.
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

  return Response.json(placeholderScore(text), { status: 200 });
}
