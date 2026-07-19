import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import data from "@/data/data.json";
import { FIELDS, fieldName } from "@/lib/fields";
import { computeScores } from "@/lib/scorer/scorer";
import { percentileOf, starsFromPercentile } from "@/lib/scorer/rating";
import { scoreBand } from "@/lib/scorer/verdict";
import PageExplainer from "@/app/components/PageExplainer";
import type { Occupation } from "@/lib/scorer/types";

// Sector page — Morningstar's sector view, for career fields. Every occupation
// in the SOC major group, rated at default weights, plus field-level aggregates.

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

const TONE_TEXT = { strong: "text-emerald-600", mixed: "text-amber-600", risky: "text-red-600" } as const;
const MOAT_CELL: Record<string, string> = { wide: "🏰 Wide", narrow: "🛡 Narrow", none: "—" };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

export function generateStaticParams() {
  return FIELDS.map((f) => ({ group: f.group }));
}

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const { group } = await params;
  return { title: `${fieldName(group)} careers — CareerStar`, description: `AI-viability ratings for every ${fieldName(group)} career.` };
}

export default async function FieldPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!FIELDS.some((f) => f.group === group)) notFound();

  const rows = OCCUPATIONS.filter((o) => o.code.slice(0, 2) === group)
    .map((o) => {
      const r = SCORE_BY_CODE.get(o.code)!;
      return {
        code: o.code,
        title: o.title,
        score: r.score,
        stars: starsFromPercentile(percentileOf(r.score, ALL_SCORES)),
        moat: o.moat ?? null,
        growthPct: o.growthPct,
        medianPay: o.medianPay,
      };
    })
    .sort((a, b) => b.score - a.score);
  if (rows.length === 0) notFound();

  const medScore = median(rows.map((r) => r.score));
  const medPay = median(rows.map((r) => r.medianPay));
  const avgGrowth = Math.round((rows.reduce((a, r) => a + r.growthPct, 0) / rows.length) * 10) / 10;
  const wide = rows.filter((r) => r.moat === "wide").length;
  const band = scoreBand(medScore);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <Link href="/explore" className="text-sm text-blue-600 hover:underline">
          ← All careers
        </Link>
        <p className="mt-4 text-sm font-medium text-foreground/55">Field</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{fieldName(group)}</h1>

        <PageExplainer>
          <p>
            This is a sector view — every {fieldName(group).toLowerCase()} career CareerStar
            rates, on the same neutral baseline, with field-level stats up top so you can size up
            the whole field at a glance.
          </p>
          <p>
            <strong>How to use it:</strong>{" "}the table is ranked best-first. Click any career for
            its full report, and watch the moat column — 🏰 wide means well-shielded from AI,
            &mdash; means broadly exposed.
          </p>
        </PageExplainer>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-foreground/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">Careers</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{rows.length}</div>
          </div>
          <div className="rounded-2xl border border-foreground/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">Median score</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${TONE_TEXT[band.tone]}`}>{medScore}</div>
          </div>
          <div className="rounded-2xl border border-foreground/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">Avg growth</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${avgGrowth < 0 ? "text-red-600" : ""}`}>
              {avgGrowth >= 0 ? "+" : ""}{avgGrowth}%
            </div>
          </div>
          <div className="rounded-2xl border border-foreground/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">Wide moats</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {wide}<span className="text-sm text-foreground/55">/{rows.length}</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-foreground/60">
          Every {fieldName(group).toLowerCase()} career, on a neutral baseline · median pay ${Math.round(medPay / 1000)}k · click a career for its full report ·{" "}
          <strong>moat</strong> = how shielded from AI (🏰 wide = well-defended, 🛡 narrow = some shelter, — = broadly exposed)
        </p>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-left text-xs text-foreground/60">
                <th scope="col" className="py-2 pr-3 font-medium">Career</th>
                <th scope="col" className="py-2 px-3 text-right font-medium">Rating</th>
                <th scope="col" className="py-2 px-3 font-medium">Moat</th>
                <th scope="col" className="py-2 px-3 text-right font-medium">Growth</th>
                <th scope="col" className="py-2 pl-3 text-right font-medium">Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-b border-foreground/5 hover:bg-foreground/[.03]">
                  <td className="py-2 pr-3">
                    <Link href={`/career/${r.code}`} className="font-medium hover:text-blue-600 hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold tabular-nums ${TONE_TEXT[scoreBand(r.score).tone]}`}>
                    ★{r.stars.toFixed(1)}
                    <span className="text-foreground/40"> · </span>
                    <span className="text-foreground/55">{r.score}</span>
                  </td>
                  <td className="whitespace-nowrap py-2 px-3 text-xs text-foreground/70">{r.moat ? MOAT_CELL[r.moat] : "—"}</td>
                  <td className={`py-2 px-3 text-right tabular-nums ${r.growthPct < 0 ? "font-medium text-red-600" : "text-foreground/70"}`}>
                    {r.growthPct >= 0 ? "+" : ""}{r.growthPct}%
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums text-foreground/70">${(r.medianPay / 1000).toFixed(0)}k</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}
