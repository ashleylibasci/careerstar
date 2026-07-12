import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";
import { computeScores } from "@/lib/scorer/scorer";
import { modelScores, modelConsensus } from "@/lib/scorer/models";
import { percentileOf, starsFromPercentile } from "@/lib/scorer/rating";
import { scoreBand } from "@/lib/scorer/verdict";
import { Stars } from "@/app/components/rating-ui";
import type { Occupation } from "@/lib/scorer/types";

export const metadata: Metadata = {
  title: "The CareerStar 20 — highest-conviction careers",
  description:
    "The 20 careers CareerStar has the most conviction in: wide AI-moat, all five rating models in agreement, ranked by model consensus.",
};

// The flagship editorial list — but purely derived, no editor. A career makes
// the 20 only if (1) it has a WIDE AI-moat, and (2) all five rating models
// score it within a ±10 band (spread ≤ 20) — i.e. even the judges that
// disagree about everything agree about this one. Ranked by model consensus.
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
const BY_CODE = new Map(OCCUPATIONS.map((o) => [o.code, o]));

const TOP20 = ALL_SCORED.map((r) => {
  const o = BY_CODE.get(r.code)!;
  const consensus = modelConsensus(modelScores(r, o.moatScore));
  return {
    code: r.code,
    title: r.path,
    score: r.score,
    stars: starsFromPercentile(percentileOf(r.score, ALL_SCORES)),
    tone: scoreBand(r.score).tone,
    mean: consensus.mean,
    spread: consensus.spread,
    moat: o.moat,
    growthPct: o.growthPct,
    medianPay: o.medianPay,
    education: o.education ?? "",
  };
})
  .filter((r) => r.moat === "wide" && r.spread <= 20)
  .sort((a, b) => b.mean - a.mean)
  .slice(0, 20);

const TONE_STAR = { strong: "fill-emerald-500", mixed: "fill-amber-500", risky: "fill-red-500" } as const;

export default function Top20Page() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl lg:max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          The flagship list
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">The CareerStar 20</h1>
        <p className="mt-3 text-foreground/70">
          The careers this system has the <strong>most conviction</strong> in — no editor, pure
          derivation. A career makes this list only if it has a{" "}
          <strong>🏰 wide AI-moat</strong> (well-shielded from AI: few automatable tasks, rare
          skills) <em>and</em> <strong>all five rating models agree</strong> (every judge within a
          ±10 band — even the ones that disagree about everything else). Ranked by model consensus.
        </p>

        <ol className="mt-8 space-y-3">
          {TOP20.map((r, i) => (
            <li key={r.code}>
              <Link
                href={`/career/${r.code}`}
                className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4 transition hover:border-blue-500/40 hover:bg-foreground/[.04]"
              >
                <span className="w-8 shrink-0 text-right text-xl font-bold tabular-nums text-foreground/40">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground/60">
                    <Stars value={r.stars} colorClass={TONE_STAR[r.tone]} id={`t20-${r.code}`} size="h-3.5 w-3.5" />
                    <span>consensus {r.mean} ±{Math.round(r.spread / 2)}</span>
                    <span className={r.growthPct < 0 ? "text-red-600" : ""}>
                      {r.growthPct >= 0 ? "+" : ""}{r.growthPct}% growth
                    </span>
                    <span>${(r.medianPay / 1000).toFixed(0)}k</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xl font-bold tabular-nums text-blue-600">{r.mean}</span>
                  <span className="block text-[9px] font-medium uppercase tracking-wide text-foreground/45">
                    consensus
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-xs leading-relaxed text-foreground/55">
          This is a neutral baseline, before any personal interests — your own ranking may differ
          (and should:{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            score your paths
          </Link>{" "}
          with your priorities). Conviction ≠ certainty: these are grounded estimates from{" "}
          <Link href="/methodology" className="text-blue-600 hover:underline">
            a documented model
          </Link>
          , not prophecies. Notably, the list skews toward hands-on and human-centered work — that
          isn&rsquo;t an editorial choice, it&rsquo;s what low AI-exposure plus rare skills looks
          like in the data.
        </p>
      </article>
    </main>
  );
}
