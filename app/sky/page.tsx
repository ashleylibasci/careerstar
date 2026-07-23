import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/data.json";
import sky from "@/data/sky.json";
import { computeScores } from "@/lib/scorer/scorer";
import { percentileOf, starsFromPercentile } from "@/lib/scorer/rating";
import { FIELDS, fieldName } from "@/lib/fields";
import PageExplainer from "@/app/components/PageExplainer";
import SkyClient, { type Constellation, type SkyStar } from "./SkyClient";
import type { Occupation } from "@/lib/scorer/types";

export const metadata: Metadata = {
  title: "The career sky — CareerStar",
  description:
    "All 730 careers drawn as one night sky: every star positioned by its real O*NET skill profile, so similar careers sit together and fields form constellations.",
  alternates: { canonical: "/sky" },
};

// The sky is the model made visible: UMAP over the same z-scored 68-d
// capability space the fit score and redirect use. Coordinates are baked
// offline by scripts/pipeline/build-sky.mjs; ratings are computed here at the
// same neutral baseline as every other page.

const typed = data as {
  occupations: Occupation[];
  meta: { skillMean: number[]; skillStd: number[] };
};
const skyData = sky as {
  meta: {
    method: string;
    umapParams: { nNeighbors: number; minDist: number; seed: number };
    neighborK: number;
    umap: { neighborPreservationPct: number; sameGroupNearestPct: number };
    pcaRejected: { varianceExplainedPct: number[]; neighborPreservationPct: number; sameGroupNearestPct: number };
    sameGroupNearestPct68d: number;
  };
  stars: { code: string; x: number; y: number }[];
};

const OCCUPATIONS = typed.occupations;
const ALL_SCORED = computeScores(
  OCCUPATIONS,
  [],
  OCCUPATIONS.map((o) => o.code),
  undefined,
  { skillMean: typed.meta.skillMean, skillStd: typed.meta.skillStd },
);
const ALL_SCORES = ALL_SCORED.map((r) => r.score);
const SCORE_BY_CODE = new Map(ALL_SCORED.map((r) => [r.code, r]));
const OCC_BY_CODE = new Map(OCCUPATIONS.map((o) => [o.code, o]));

const STARS: SkyStar[] = skyData.stars.flatMap((s): SkyStar[] => {
  const occ = OCC_BY_CODE.get(s.code);
  const rated = SCORE_BY_CODE.get(s.code);
  if (!occ || !rated) return [];
  const group = s.code.slice(0, 2);
  return [
    {
      code: s.code,
      title: occ.title,
      x: s.x,
      y: s.y,
      score: rated.score,
      stars: starsFromPercentile(percentileOf(rated.score, ALL_SCORES)),
      moat: occ.moat ?? null,
      group,
      field: fieldName(group),
    },
  ];
});

// Constellation labels at field centroids — only fields with enough stars to
// visibly cluster; tiny fields would get a label floating over noise.
const CONSTELLATIONS: Constellation[] = FIELDS.map((f) => {
  const members = STARS.filter((s) => s.group === f.group);
  if (members.length < 8) return null;
  return {
    group: f.group,
    name: f.name,
    x: members.reduce((a, s) => a + s.x, 0) / members.length,
    y: members.reduce((a, s) => a + s.y, 0) / members.length,
    n: members.length,
  };
}).filter((c): c is Constellation => c !== null);

const M = skyData.meta;

export default function SkyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          The model, made visible
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">The career sky</h1>
        <p className="mt-2 max-w-3xl text-foreground/70">
          Every career the U.S. government tracks, drawn as one night sky. A star&rsquo;s position
          comes from its <strong>real skill profile</strong>{" "}(35 O*NET skills + 33 knowledge
          areas) — careers that use similar capabilities sit near each other, and fields condense
          into constellations <em>on their own</em>, from the math, not from an editor. Brighter =
          higher rated; <span className="font-semibold text-blue-600">cobalt</span>{" "}= wide AI-moat.
        </p>

        <PageExplainer>
          <p>
            This is the same capability space the personal-fit score and career suggestions
            already use — projected from 68 dimensions down to 2 so you can see it. Nearby stars
            mean genuinely similar skill profiles, which is exactly what makes a career switch
            plausible.
          </p>
          <p>
            <strong>How to use it:</strong>{" "}hover any star for its rating, click for the full
            report, and pick your interests above the map to see where <em>you</em>{" "}land — the
            marker sits at the center of the careers most similar to your profile. One honest
            caveat: only <em>local</em>{" "}neighborhoods are meaningful. Distances between distant
            constellations are an artifact of flattening 68 dimensions into 2 (details below the
            map).
          </p>
        </PageExplainer>

        <div className="mt-8">
          <SkyClient stars={STARS} constellations={CONSTELLATIONS} />
        </div>

        {/* The honesty panel: what this projection provably keeps, what it loses,
            and what was rejected on the way here. */}
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-foreground/60">
            How much can you trust this picture?
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xl font-bold tabular-nums text-blue-600">{M.umap.neighborPreservationPct}%</div>
              <div className="mt-0.5 text-xs text-foreground/60">
                of each career&rsquo;s {M.neighborK} truest neighbors (in full 68-d space) are
                still its neighbors on this map
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tabular-nums text-blue-600">
                {M.umap.sameGroupNearestPct}% <span className="text-sm font-semibold text-foreground/45">/ {M.sameGroupNearestPct68d}%</span>
              </div>
              <div className="mt-0.5 text-xs text-foreground/60">
                nearest star is from the same field, here / in the full 68-d space (the ceiling)
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tabular-nums text-blue-600">{M.pcaRejected.neighborPreservationPct}%</div>
              <div className="mt-0.5 text-xs text-foreground/60">
                what PCA — the simpler method tried first — preserved. It was rejected for losing
                the neighborhoods ({M.pcaRejected.varianceExplainedPct[0]}%+{M.pcaRejected.varianceExplainedPct[1]}% variance explained)
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-foreground/60">
            Method: seeded UMAP (nNeighbors {M.umapParams.nNeighbors}, minDist {M.umapParams.minDist}, seed{" "}
            {M.umapParams.seed}) over z-scored capability vectors — fully reproducible from{" "}
            <a
              href="https://github.com/ashleylibasci/careerstar/blob/main/scripts/pipeline/build-sky.mjs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              build-sky.mjs
            </a>
            . Flattening 68 dimensions to 2 necessarily lies a little; the numbers above measure
            the lie. The &ldquo;you are here&rdquo; marker doesn&rsquo;t pretend to invert the
            projection — it sits at the similarity-weighted center of your nearest careers, which
            are named under the picker. Same capability data as the{" "}
            <Link href="/methodology" className="font-medium text-blue-600 hover:underline">
              fit score
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
