import { ImageResponse } from "next/og";
import data from "@/data/data.json";
import { computeScores } from "@/lib/scorer/scorer";
import { percentileOf, starsFromPercentile } from "@/lib/scorer/rating";
import { MOAT_LABEL } from "@/lib/scorer/moat";
import { scoreBand } from "@/lib/scorer/verdict";
import type { Occupation } from "@/lib/scorer/types";

// Per-career social card: share a career report and the link unfurls as
// "Registered nurses ★★★★½ · 60/100 · Wide moat" — the rating travels with the URL.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CareerStar rating card";

const typed = data as {
  occupations: Occupation[];
  meta: { skillMean: number[]; skillStd: number[] };
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

const TONE_HEX = { strong: "#10b981", mixed: "#f59e0b", risky: "#ef4444" } as const;
const STAR_PATH = "M10 1l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77 4.79 17.5l.99-5.8-4.21-4.1 5.82-.85z";

function Star({ fill }: { fill: string }) {
  return (
    <svg width="54" height="54" viewBox="0 0 20 20">
      <path d={STAR_PATH} fill={fill} />
    </svg>
  );
}

export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const occ = OCCUPATIONS.find((o) => o.code === code);
  const rated = SCORE_BY_CODE.get(code);

  const title = occ?.title ?? "Career report";
  const score = rated?.score ?? null;
  const stars = rated ? starsFromPercentile(percentileOf(rated.score, ALL_SCORES)) : 0;
  const tone = rated ? TONE_HEX[scoreBand(rated.score).tone] : "#64748b";
  const moat = occ?.moat ? MOAT_LABEL[occ.moat] : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0f1e",
          padding: "64px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="0 0 20 20">
            <path d={STAR_PATH} fill="#2563eb" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>CareerStar</div>
          <div style={{ fontSize: 26, color: "#64748b", marginLeft: 8 }}>research report</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: title.length > 34 ? 52 : 68, fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} fill={i <= Math.round(stars) ? tone : "#1e293b"} />
              ))}
            </div>
            {score != null && (
              <div style={{ fontSize: 52, fontWeight: 700, color: tone }}>{`${score}/100`}</div>
            )}
            {moat && (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#93c5fd",
                  backgroundColor: "rgba(37,99,235,0.18)",
                  padding: "10px 22px",
                  borderRadius: 999,
                }}
              >
                {moat}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#64748b" }}>
          Rate careers like stocks — real BLS + O*NET data, five rating models, the math shown.
        </div>
      </div>
    ),
    size,
  );
}
