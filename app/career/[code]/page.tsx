import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import data from "@/data/data.json";
import backtestData from "@/data/backtest.json";
import educationData from "@/data/education.json";
import { fieldName } from "@/lib/fields";
import { roi } from "@/lib/education";
import { computeScores } from "@/lib/scorer/scorer";
import { percentileOf, starsFromPercentile, bullsAndBears, uncertaintyLabel } from "@/lib/scorer/rating";
import { plainVerdict, scoreBand } from "@/lib/scorer/verdict";
import { Stars } from "@/app/components/rating-ui";
import MoatBadge from "@/app/components/MoatBadge";
import PrintButton from "@/app/components/PrintButton";
import FeedbackWidget from "@/app/components/FeedbackWidget";
import type { Occupation, ScoreResult } from "@/lib/scorer/types";

const typed = data as {
  occupations: Occupation[];
  meta: { skillMean: number[]; skillStd: number[] };
};
const OCCUPATIONS = typed.occupations;

// The "analyst rating": every career scored once at module load under the
// DEFAULT weights with no personal interests — the neutral, comparable rating
// a research report needs (personalization happens on the home page).
const SKILL_STATS = { skillMean: typed.meta.skillMean, skillStd: typed.meta.skillStd };
const ALL_SCORED = computeScores(OCCUPATIONS, [], OCCUPATIONS.map((o) => o.code), undefined, SKILL_STATS);
const SCORE_BY_CODE = new Map(ALL_SCORED.map((r) => [r.code, r]));
const ALL_SCORES = ALL_SCORED.map((r) => r.score);

// Style-box boundaries: terciles of return and risk across the whole market.
function terciles(values: number[]): [number, number] {
  const s = [...values].sort((a, b) => a - b);
  return [s[Math.floor(s.length / 3)], s[Math.floor((2 * s.length) / 3)]];
}
const RETURN_T = terciles(ALL_SCORED.map((r) => r.components.return));
const RISK_T = terciles(ALL_SCORED.map((r) => r.components.risk));
const tercileOf = (v: number, [t1, t2]: [number, number]) => (v < t1 ? 0 : v < t2 ? 1 : 2);

const TONE_TEXT = { strong: "text-emerald-600", mixed: "text-amber-600", risky: "text-red-600" } as const;
const TONE_STAR = { strong: "fill-emerald-500", mixed: "fill-amber-500", risky: "fill-red-500" } as const;

/** Morningstar-style 3×3 style box: reward (rows, high→low) × risk (cols, low→high). */
function StyleBox({ result }: { result: ScoreResult }) {
  const rewardRow = 2 - tercileOf(result.components.return, RETURN_T); // 0 = high reward on top
  const riskCol = tercileOf(result.components.risk, RISK_T); // 0 = low risk on left
  return (
    <div>
      <div className="grid w-28 grid-cols-3 overflow-hidden rounded-lg border border-foreground/15">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <div
              key={`${row}${col}`}
              className={`aspect-square border border-foreground/10 ${
                row === rewardRow && col === riskCol ? "bg-blue-600" : "bg-foreground/[.03]"
              }`}
            />
          )),
        )}
      </div>
      <div className="mt-1 flex w-28 justify-between text-[9px] text-foreground/55">
        <span>low risk</span>
        <span>high</span>
      </div>
      <div className="text-[9px] text-foreground/55">top row = high reward</div>
    </div>
  );
}

// Per-occupation decade data: what 2014's BLS projected vs what actually happened.
const BACKTEST_BY_SOC = (backtestData as unknown as {
  bySoc: Record<string, { projectedPct: number; realizedPct: number; score2014: number }>;
}).bySoc;

interface EduRow {
  earn1yr: number | null;
  debt: number | null;
  programs: number;
  majors: string[];
  schools: { name: string; state: string; cost: number | null; earn10: number | null; admRate: number | null }[];
}
const EDUCATION = (educationData as { education: Record<string, EduRow> }).education;

function findOccupation(code: string): Occupation | undefined {
  return OCCUPATIONS.find((o) => o.code === code);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const occ = findOccupation(code);
  if (!occ) return { title: "Career not found — CareerStar" };
  return {
    title: `${occ.title} — CareerStar`,
    description: `Projected growth, median pay, and AI exposure for ${occ.title}.`,
  };
}

function Stat({
  label,
  value,
  caveat,
}: {
  label: string;
  value: string;
  caveat?: string;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {caveat ? (
        <div className="mt-1 text-xs text-foreground/60">{caveat}</div>
      ) : null}
    </div>
  );
}

export default async function CareerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const occ = findOccupation(code);
  if (!occ) notFound();

  const group = code.slice(0, 2);
  const related = OCCUPATIONS.filter(
    (o) => o.code.slice(0, 2) === group && o.code !== code,
  ).slice(0, 6);
  const edu = EDUCATION[code.split(".")[0]];
  const decade = BACKTEST_BY_SOC[code.split(".")[0]];

  // Analyst rating (default weights, no personalization).
  const rated = SCORE_BY_CODE.get(code);
  const pct = rated ? percentileOf(rated.score, ALL_SCORES) : null;
  const stars = pct != null ? starsFromPercentile(pct) : null;
  const band = rated ? scoreBand(rated.score) : null;
  const bb = rated ? bullsAndBears(rated) : null;
  const analystTake = rated ? plainVerdict(occ, rated.components, false) : null;
  const uncertainty = rated ? uncertaintyLabel(rated.confidence) : null;

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        <Link href="/explore" className="text-sm text-blue-600 hover:underline">
          ← Back to explore
        </Link>

        <p className="mt-4 text-sm font-medium text-foreground/60">
          <Link href={`/field/${group}`} className="hover:text-blue-600 hover:underline">
            {fieldName(group)}
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{occ.title}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Typically requires {occ.education || "no formal credential"} · ROI ≈ $
          {roi(occ.medianPay, occ.education).toLocaleString()}/yr of schooling
        </p>

        {rated && band && (
          <div className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/55">
                  CareerStar rating
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  {stars != null && <Stars value={stars} colorClass={TONE_STAR[band.tone]} id={`report-${code}`} size="h-5 w-5" />}
                  <span className={`text-sm font-bold ${TONE_TEXT[band.tone]}`}>{band.label}</span>
                  {occ.moat && <MoatBadge moat={occ.moat} />}
                  {uncertainty && (
                    <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/60">
                      {uncertainty} uncertainty
                    </span>
                  )}
                </div>
                {pct != null && pct >= 50 && (
                  <div className="mt-1 text-xs text-foreground/55">
                    top {Math.max(1, 100 - Math.round(pct))}% of all {OCCUPATIONS.length} careers
                  </div>
                )}
                {analystTake && (
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/75">
                    <span className="font-semibold text-foreground/60">Analyst take: </span>
                    {analystTake}
                  </p>
                )}
              </div>
              <div className="flex items-start gap-6">
                <div className="text-right">
                  <div className={`text-4xl font-bold tabular-nums ${TONE_TEXT[band.tone]}`}>{rated.score}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-foreground/55">/ 100</div>
                </div>
                <StyleBox result={rated} />
              </div>
            </div>

            {occ.moat && (
              <p className="mt-3 text-xs leading-relaxed text-foreground/55">
                <strong>Moat</strong> (borrowed from investing — the water that defends a castle):
                how shielded this career is from AI.{" "}
                {occ.moat === "wide"
                  ? "Wide = well-defended — few automatable tasks, built on skills few other jobs have."
                  : occ.moat === "narrow"
                    ? "Narrow = some shelter, but AI can reach a real share of its tasks."
                    : "None = broadly exposed — many of its tasks are automatable and its skills are widely shared. (Exposure ≠ job loss; see the bears below.)"}
              </p>
            )}

            {bb && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[.05] p-3">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    🐂 Bulls say
                  </div>
                  <ul className="space-y-1.5 text-xs leading-snug text-foreground/75">
                    {bb.bulls.map((b, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-emerald-600">+</span>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[.05] p-3">
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                    🐻 Bears say
                  </div>
                  <ul className="space-y-1.5 text-xs leading-snug text-foreground/75">
                    {bb.bears.map((b, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-red-500">−</span>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {decade && (
              <div className="mt-4 rounded-xl border border-foreground/10 bg-foreground/[.03] p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                  📜 Reality check — how the last forecast for this career fared
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
                  In 2014, the U.S. government projected{" "}
                  <strong>{decade.projectedPct >= 0 ? "+" : ""}{decade.projectedPct}%</strong>{" "}
                  growth for this career by 2024. What actually happened:{" "}
                  <strong className={decade.realizedPct < 0 ? "text-red-600" : "text-emerald-600"}>
                    {decade.realizedPct >= 0 ? "+" : ""}{decade.realizedPct}%
                  </strong>
                  . {Math.abs(decade.realizedPct - decade.projectedPct) <= 10
                    ? "The forecast held up well —"
                    : decade.realizedPct > decade.projectedPct
                      ? "Reality beat the forecast —"
                      : "Reality fell short of the forecast —"}{" "}
                  a reminder that every number on this page is an estimate, and this is how the
                  last one aged.{" "}
                  <Link href="/methodology" className="font-medium text-blue-600 hover:underline">
                    Full back-test →
                  </Link>
                </p>
              </div>
            )}

            <div className="mt-4">
              <FeedbackWidget code={code} />
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            label="Projected growth"
            value={`${occ.growthPct >= 0 ? "+" : ""}${occ.growthPct}%`}
          />
          <Stat
            label="Median pay"
            value={`$${occ.medianPay.toLocaleString()}`}
          />
          <Stat
            label="AI exposure"
            value={`${Math.round(occ.aiExposure * 100)}/100`}
            caveat="share of tasks exposed to AI — not job loss"
          />
        </div>

        {edu ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Education &amp; ROI — how to get here</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Real outcomes for the college majors that feed this occupation, across{" "}
              {edu.programs.toLocaleString()} bachelor&rsquo;s programs.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label="Median earnings"
                value={edu.earn1yr ? `$${edu.earn1yr.toLocaleString()}` : "—"}
                caveat="1 year after graduating"
              />
              <Stat
                label="Typical debt"
                value={edu.debt ? `$${edu.debt.toLocaleString()}` : "—"}
                caveat="median federal debt"
              />
              <Stat
                label="Pay-to-debt"
                value={edu.earn1yr && edu.debt ? `${(edu.earn1yr / edu.debt).toFixed(1)}×` : "—"}
                caveat="first-year pay ÷ debt"
              />
            </div>

            {edu.majors.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Feeder majors
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {edu.majors.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-foreground/10 bg-foreground/[.03] px-3 py-1 text-xs text-foreground/70"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {edu.schools.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Selective schools offering these majors
                </div>
                <div className="mt-2 divide-y divide-foreground/10 overflow-hidden rounded-2xl border border-foreground/10">
                  {edu.schools.map((s) => (
                    <div key={s.name} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-foreground/60">
                          {s.state}
                          {s.admRate != null ? ` · ${Math.round(s.admRate * 100)}% admit rate` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs tabular-nums">
                        {s.cost != null ? (
                          <div className="text-foreground/60">${s.cost.toLocaleString()}/yr</div>
                        ) : null}
                        {s.earn10 != null ? (
                          <div className="font-medium text-emerald-600">${s.earn10.toLocaleString()} grad pay</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-foreground/60">
              Earnings &amp; debt from the U.S. Dept. of Education <strong>College Scorecard</strong>;
              majors mapped to this occupation via the NCES CIP→SOC crosswalk. A grounded ROI
              snapshot, not a guarantee — pay varies widely by school and specialty.
            </p>
          </div>
        ) : null}

        {occ.skills.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Interests &amp; skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {occ.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-foreground/10 bg-foreground/[.03] px-3 py-1 text-xs text-foreground/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/?careers=${code}`}
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 print:hidden"
          >
            Score this career →
          </Link>
          {related.length > 0 && (
            <Link
              href={`/?careers=${[code, ...related.slice(0, 2).map((o) => o.code)].join(",")}`}
              className="inline-flex items-center rounded-2xl border border-foreground/15 px-5 py-3 text-sm font-semibold transition hover:border-blue-500/50 print:hidden"
            >
              ⚖️ Compare with similar careers
            </Link>
          )}
          <PrintButton />
        </div>

        {related.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight">Related careers</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((o) => (
                <Link
                  key={o.code}
                  href={`/career/${o.code}`}
                  className="rounded-2xl border border-foreground/10 p-4 hover:bg-foreground/[.03]"
                >
                  <div className="font-medium">{o.title}</div>
                  <div className="mt-1 text-xs text-foreground/60 tabular-nums">
                    {o.growthPct >= 0 ? "+" : ""}
                    {o.growthPct}% growth · ${o.medianPay.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
