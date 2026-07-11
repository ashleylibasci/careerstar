import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";
import backtest from "@/data/backtest.json";
import { computeScores } from "@/lib/scorer/scorer";
import { MODELS } from "@/lib/scorer/models";
import type { Occupation } from "@/lib/scorer/types";

export const metadata: Metadata = {
  title: "Methodology — CareerStar",
  description:
    "How CareerStar computes its risk-adjusted career viability scores: the model, the weights, the data sources, robustness, and the limitations.",
};

const typed = data as {
  occupations: Occupation[];
  meta: {
    skillMean: number[];
    skillStd: number[];
    validation?: { exposureGrowthSpearman: number; exposureQuartileGrowthPct: number[] };
  };
};
const validation = typed.meta.validation;

// Real distributions across all 730 careers at default weights (module-level, once).
const ALL = computeScores(
  typed.occupations,
  [],
  typed.occupations.map((o) => o.code),
  undefined,
  { skillMean: typed.meta.skillMean, skillStd: typed.meta.skillStd },
);
const SCORE_BINS = Array.from({ length: 10 }, (_, i) => ({
  label: `${i * 10}`,
  n: ALL.filter((r) => r.score >= i * 10 && (i === 9 ? r.score <= 100 : r.score < (i + 1) * 10)).length,
}));
const MAX_BIN = Math.max(...SCORE_BINS.map((b) => b.n));
const MOAT_COUNTS = ["wide", "narrow", "none"].map((m) => ({
  m,
  n: typed.occupations.filter((o) => o.moat === m).length,
}));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to CareerStar
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">How scores are calculated</h1>
        <p className="mt-3 text-foreground/70">
          CareerStar treats each career like a financial asset — weighing expected
          return against risk — and blends the result with how well the path fits you.
          Everything below is deterministic: the same inputs always produce the same
          score. The number is computed by an explicit model, <strong>not</strong> by an
          AI language model.
        </p>

        <Section title="The model">
          <p>Each occupation gets a 0–100 score from three ingredients:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Return</strong> — projected employment growth and median pay, each
              ranked against every other occupation in the set.
            </li>
            <li>
              <strong>Risk</strong> — AI/automation exposure (dominant) plus a volatility
              proxy (a field projected to shrink is treated as riskier).
            </li>
            <li>
              <strong>Fit</strong> — how well the occupation&rsquo;s real skill profile matches
              your interests, measured in O*NET capability-space (see below).
            </li>
          </ul>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`Return = wGrowth·growth + wPay·pay
Risk   = wExposure·exposure + wVolatility·volatility
RAV    = Return · (1 − γ·Risk)          (risk-adjusted return)
Score  = 100 · [ α·RAV + (1 − α)·Fit ]`}
          </pre>
          <p>
            The weights (<code>wGrowth, wPay, wExposure, wVolatility, γ, α</code>) are
            explicit and documented in the code, so the model can be tuned and its
            sensitivity analyzed — raise the pay weight and finance climbs; raise γ and
            AI-exposed fields sink.
          </p>
        </Section>

        <Section title="Fit, in O*NET capability-space">
          <p>
            Every occupation carries a real <strong>68-dimensional capability vector</strong> —
            the O*NET importance ratings for 35 <em>skills</em> (Critical Thinking, Programming,
            Mathematics…) and 33 <em>knowledge</em> areas (Economics &amp; Accounting, Engineering,
            Medicine, Law…). Your stated interests are mapped into the same space through an
            explicit, documented lexicon, and fit is the overlap of the two.
          </p>
          <p>
            One subtlety matters: nearly every professional job rates high on the common skills, so
            a naïve overlap barely distinguishes them. CareerStar instead
            <strong> weights each capability by how distinctive it is across the whole labor
            market</strong> (a z-score per dimension), so a match on a rare, defining skill counts
            far more than a match on one everybody shares. That is what lets fit tell finance from
            engineering, not just desk-work from the trades. It remains a modeling choice, stated as
            one — two quantitatively similar fields can still both score high.
          </p>
        </Section>

        <Section title="The AI-moat rating">
          <p>
            Borrowed from Morningstar&rsquo;s economic moat: how <strong>defensible</strong> is a
            career against AI pressure? It is a fixed, documented formula — not a vibe:
          </p>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`defensibility = 0.6·(1 − aiExposure) + 0.4·distinctiveness
distinctiveness = clamp( (mean of top-5 z-scored capabilities − 1) / 2 )

Wide moat   ≥ 0.70      (~20% of careers)
Narrow moat ≥ 0.55      (~50%)
No moat     < 0.55      (~30%)`}
          </pre>
          <p>
            Low AI exposure is shelter; <em>distinctiveness</em> asks whether the career&rsquo;s
            defining capabilities are rare in the labor market or ones every job shares. The
            thresholds are calibrated once on the full 730-occupation distribution to a
            Morningstar-like shape and then fixed. The model makes uncomfortable calls — it gives
            software developers <strong>no moat</strong> (extreme LLM exposure) while their
            risk-adjusted <em>score</em> stays high — and we ship those calls rather than tune them
            away. For 25 newer SOC codes O*NET hasn&rsquo;t yet rated (software developers among
            them), capability vectors are <strong>estimated from their SOC-group siblings</strong>{" "}
            and flagged as estimates in the data.
          </p>
          <p>
            Score uncertainty is also stated in words on every card — Low (±5 or less), Medium
            (±6–8), High (±9–10), Very high (±11+) — wider with high AI exposure or weak fit.
          </p>
        </Section>

        <Section title="What the rated universe looks like">
          <p>
            The real distributions across all {typed.occupations.length} occupations at default
            weights — the forced star-curve is applied on top of the score distribution, and the
            moat split is calibrated once to a Morningstar-like shape:
          </p>
          <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
            <div className="text-xs font-medium text-foreground/60">Score distribution (0–100, bins of 10)</div>
            <div className="mt-2 flex h-24 items-end gap-1" role="img" aria-label="Histogram of scores across all careers">
              {SCORE_BINS.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-1" title={`${b.label}–${Number(b.label) + 9}: ${b.n} careers`}>
                  <div
                    className="w-full rounded-t bg-blue-500/70"
                    style={{ height: `${Math.max(2, (b.n / MAX_BIN) * 80)}px` }}
                  />
                  <span className="text-[9px] tabular-nums text-foreground/55">{b.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs font-medium text-foreground/60">AI-moat split</div>
            <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full" role="img" aria-label="Moat distribution across all careers">
              {MOAT_COUNTS.map(({ m, n }) => (
                <div
                  key={m}
                  title={`${m}: ${n} careers`}
                  className={m === "wide" ? "bg-blue-600" : m === "narrow" ? "bg-blue-400/60" : "bg-foreground/15"}
                  style={{ width: `${(n / typed.occupations.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-foreground/60">
              {MOAT_COUNTS.map(({ m, n }) => (
                <span key={m}>
                  <span className={`mr-1 inline-block h-2 w-2 rounded-full ${m === "wide" ? "bg-blue-600" : m === "narrow" ? "bg-blue-400/60" : "bg-foreground/15"}`} />
                  {m} {n} ({Math.round((n / typed.occupations.length) * 100)}%)
                </span>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Robustness (does the answer survive?)">
          <p>
            The weights are a deliberate choice, so the fair test is whether the ranking holds when
            you disagree with them. For every comparison, CareerStar re-scores the careers across
            <strong> 729 weightings</strong> — every weight moved ±20% on a fixed grid — and reports
            how often each career keeps its rank. A result that holds across all 729 is robust; one
            that shuffles is flagged as a <em>close call</em> rather than sold as a verdict. You can
            watch this live by moving the sliders on the results screen.
          </p>
        </Section>

        <Section title="Five rival models (model risk, made visible)">
          <p>
            Any single formula is one opinion about how much AI risk should count. So every
            comparison is also scored under <strong>four rival models</strong> — different
            philosophies, not weight tweaks — and the app shows when they agree (conviction) and
            when they crown different winners (genuine uncertainty):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-foreground/10 text-left text-foreground/60">
                  <th scope="col" className="py-1.5 pr-3 font-medium">Model</th>
                  <th scope="col" className="py-1.5 px-3 font-medium">Philosophy</th>
                  <th scope="col" className="py-1.5 pl-3 font-medium">Formula</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.id} className="border-b border-foreground/5 align-top">
                    <td className="whitespace-nowrap py-2 pr-3 font-semibold">{m.name}</td>
                    <td className="py-2 px-3 text-foreground/70">{m.tagline}</td>
                    <td className="whitespace-nowrap py-2 pl-3 font-mono text-[11px] text-foreground/60">{m.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The naive equal-weight model is deliberately included as a control — a model that
            can&rsquo;t distinguish itself from 1/N isn&rsquo;t earning its complexity.
          </p>
        </Section>

        <Section title="Data sources">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Growth &amp; pay</strong> — U.S. Bureau of Labor Statistics,
              Employment Projections 2024&ndash;2034 (public domain) — ~730 occupations
              across every field.
            </li>
            <li>
              <strong>AI exposure</strong> — Eloundou et al. 2023, “GPTs are GPTs”
              (occupation-level exposure, β measure; MIT-licensed).
            </li>
            <li>
              <strong>Skills &amp; knowledge</strong> — O*NET 29.0 Database (U.S. DOL/ETA,
              CC BY 4.0), Skills and Knowledge importance ratings.
            </li>
            <li>Occupations are keyed by O*NET-SOC code.</li>
          </ul>
        </Section>

        {validation && (
          <Section title="Does “AI exposure” just mean “decline”?">
            <p>
              A fair objection: maybe the risk score is redundant — maybe exposed jobs are simply the
              shrinking ones. The data says no. Across all {(data as { meta: { occupationCount: number } }).meta.occupationCount} occupations,
              AI exposure and projected growth are <strong>almost uncorrelated</strong>{" "}
              (Spearman ρ&nbsp;=&nbsp;{validation.exposureGrowthSpearman}). Sorting jobs into exposure quartiles,
              average projected growth stays flat — {validation.exposureQuartileGrowthPct.map((g, i) =>
                `Q${i + 1}: ${g}%`).join(", ")} — with no downward trend.
            </p>
            <p>
              So exposure carries information growth doesn&rsquo;t, which is exactly why a
              risk-<em>adjusted</em>{" "}score beats ranking on growth alone — and why
              &ldquo;exposure&nbsp;≠&nbsp;displacement&rdquo; is literally true here, not just a
              slogan. (A true out-of-sample back-test against an archived BLS vintage is planned
              future work; the code has a hook for a dropped-in historical dataset.)
            </p>
          </Section>
        )}

        <Section title="The back-test: 2014 → 2024, a real decade">
          <p>
            The strongest test we could run: score the <strong>2014 labor market</strong>{" "}with
            today&rsquo;s model (using the archived BLS 2014&ndash;24 projections vintage,
            recovered from the Internet Archive) and compare against{" "}
            <strong>what actually happened by 2024</strong> — {backtest.meta.joined} occupations
            joined across the decade.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">ρ {backtest.metrics.spearmanScoreVsRealized}</div>
              <div className="mt-1 text-xs text-foreground/60">2014 score vs realized change</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.declinerHitRatePct}%</div>
              <div className="mt-1 text-xs text-foreground/60">of actual decliners flagged (33% base rate)</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.medianScoreDecliners} vs {backtest.metrics.medianScoreGrowers}</div>
              <div className="mt-1 text-xs text-foreground/60">median 2014 score: decliners vs growers</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">ρ {backtest.metrics.spearmanExposureVsRealized}</div>
              <div className="mt-1 text-xs text-foreground/60">AI exposure vs that decade (expected ≈ 0)</div>
            </div>
          </div>
          <p>
            Read it honestly. The score genuinely tracked a real decade (rank correlation{" "}
            {backtest.metrics.spearmanScoreVsRealized}; decliners flagged at{" "}
            {backtest.metrics.declinerHitRatePct}% vs a 33% base rate — a{" "}
            {Math.round((backtest.metrics.declinerHitRatePct / 33) * 100) / 100}× lift). The raw
            BLS projection alone scored ρ {backtest.metrics.spearmanBlsProjectionVsRealized} —
            slightly better — because the <strong>AI-risk adjustment added nothing for
            2014&ndash;24</strong> (exposure ρ ≈ {backtest.metrics.spearmanExposureVsRealized}).
            That is exactly what the model claims: 2014&ndash;24 was a pre-LLM decade, and
            exposure is a <em>forward-looking</em>{" "}bet the past cannot score. The back-test
            validates the part of the model that history can test, and says so about the part it
            can&rsquo;t.
          </p>
          <p>
            The misses, named: the model liked oil-and-gas roles in 2014 (
            {backtest.biggestMisses[2].title.toLowerCase()}, score{" "}
            {backtest.biggestMisses[2].score2014}) that fell{" "}
            {Math.abs(backtest.biggestMisses[2].realizedPct)}% when oil prices crashed — a
            systemic shock no occupation-level model catches. And it under-rated couriers
            (+166% on the e-commerce boom). Some extreme outliers also reflect SOC
            reclassification rather than real change. Full numbers, misses, and false alarms:{" "}
            <a
              href="https://github.com/ashleylibasci/careerstar/blob/main/data/backtest.json"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              data/backtest.json
            </a>
            .
          </p>
        </Section>

        <Section title="Check my math — download the data">
          <p>
            Every rating on this site is in one open CSV:{" "}
            <a
              href="/careerstar-ratings.csv"
              download
              className="font-medium text-blue-600 hover:underline"
            >
              careerstar-ratings.csv
            </a>{" "}
            — all {typed.occupations.length} occupations with the default-weight score, stars,
            percentile, AI-moat, all five model scores, consensus, growth, pay, exposure, and a
            flag for the {"≈25"} careers whose capability vectors are estimated. If a number
            looks wrong, the formulas are on this page and the code is{" "}
            <a
              href="https://github.com/ashleylibasci/careerstar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              on GitHub
            </a>{" "}
            — auditing it is encouraged. Derived ratings are CC&nbsp;BY&nbsp;4.0 (cite CareerStar);
            upstream data keeps its own licenses (BLS public domain, O*NET CC&nbsp;BY&nbsp;4.0,
            Eloundou MIT).
          </p>
        </Section>

        <Section title="Limitations (read these)">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Exposure is not job loss.</strong> AI exposure measures the share of
              tasks a model could touch — not whether the job disappears.
            </li>
            <li>
              <strong>It&rsquo;s an estimate, not a prediction.</strong> No one can see the
              future of the labor market; this is a grounded, transparent snapshot.
            </li>
            <li>
              <strong>Fit is a model, not a verdict.</strong> It uses real O*NET skill and
              knowledge vectors, but the interest→capability lexicon is hand-authored, so fit is a
              defensible estimate — and two quantitatively similar fields (say finance and
              engineering) can score alike.
            </li>
            <li>
              <strong>The volatility term is a proxy.</strong> No public dataset measures
              career volatility directly, so it is constructed from projected growth.
            </li>
          </ul>
        </Section>

        <p className="mt-12 text-xs text-foreground/60">
          Built with an AI-native workflow. The language model only writes the plain-English
          explanations — it never computes a score.
        </p>
      </article>
    </main>
  );
}
