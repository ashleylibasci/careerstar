import data from "@/data/data.json";
import type { Occupation } from "@/lib/scorer/types";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

// POST /api/feedback — "was this rating fair?" (the user-feedback loop).
//
// Deliberately stateless, on-architecture: no database is added for this. Each
// vote is validated, stripped to zero PII, and emitted as a structured log line
// that Amplify captures in CloudWatch — aggregate later with a log query
// (see LAUNCH_CHECKLIST.md). Worst case, feedback is lost; user data never is.

const VALID_CODES = new Set(
  (data as { occupations: Occupation[] }).occupations.map((o) => o.code),
);

export async function POST(request: Request) {
  // Separate rate bucket from /api/score so votes never eat scoring quota.
  const limit = rateLimit(`fb:${clientKey(request)}`);
  if (!limit.allowed) {
    return Response.json({ ok: false }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let body: { code?: unknown; fair?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const code = typeof body?.code === "string" ? body.code : "";
  const fair = body?.fair;
  if (!VALID_CODES.has(code) || typeof fair !== "boolean") {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Zero PII: occupation + verdict + timestamp. No IP, no UA, no text.
  console.log(JSON.stringify({ type: "rating-feedback", code, fair, ts: new Date().toISOString() }));

  return Response.json({ ok: true });
}
