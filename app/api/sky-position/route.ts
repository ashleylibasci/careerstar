import data from "@/data/data.json";
import sky from "@/data/sky.json";
import type { Occupation } from "@/lib/scorer/types";
import { buildInterestVector, cosine, zNormalize } from "@/lib/scorer/skills";
import { rateLimit, clientKey } from "@/lib/security/rate-limit";

// POST /api/sky-position — body: { interests: string[] }
// Places the user on the career sky. UMAP can't project new points exactly, so
// we don't pretend: the position is the similarity-weighted centroid of the
// nearest careers' star coordinates (similarity = cosine in the same z-scored
// capability space the fit score uses), and the response names those anchors
// so the page can say exactly how the placement was made.

const typed = data as {
  occupations: Occupation[];
  meta: { skillMean: number[]; skillStd: number[] };
};
const STATS = { skillMean: typed.meta.skillMean, skillStd: typed.meta.skillStd };
const STAR_BY_CODE = new Map((sky as { stars: { code: string; x: number; y: number }[] }).stars.map((s) => [s.code, s]));

// Precompute z-scored capability vectors once per process.
const Z = typed.occupations
  .filter((o) => STAR_BY_CODE.has(o.code) && Array.isArray(o.skillVector))
  .map((o) => ({ code: o.code, title: o.title, z: zNormalize(o.skillVector as number[], STATS) }));

const K_ANCHORS = 8;

export async function POST(request: Request) {
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

  const interestsRaw = (body as { interests?: unknown } | null)?.interests;
  if (!Array.isArray(interestsRaw) || interestsRaw.length === 0 || interestsRaw.length > 20) {
    return Response.json({ error: "interests must be a non-empty array (max 20)." }, { status: 400 });
  }
  const interests = interestsRaw
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.slice(0, 40));

  const target = buildInterestVector(interests);
  if (!target) return Response.json({ placed: false });

  const sims = Z.map((o) => ({ code: o.code, title: o.title, sim: cosine(target, o.z) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, K_ANCHORS)
    .filter((s) => s.sim > 0);
  if (sims.length === 0) return Response.json({ placed: false });

  // Squared weights so the closest anchors dominate the placement.
  let x = 0,
    y = 0,
    w = 0;
  for (const s of sims) {
    const star = STAR_BY_CODE.get(s.code)!;
    const weight = s.sim * s.sim;
    x += star.x * weight;
    y += star.y * weight;
    w += weight;
  }

  return Response.json({
    placed: true,
    x: x / w,
    y: y / w,
    anchors: sims.slice(0, 5).map((s) => ({ code: s.code, title: s.title, sim: Math.round(s.sim * 100) / 100 })),
  });
}
