import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";

export const metadata: Metadata = {
  title: "Methodology — CareerStar",
  description:
    "How CareerStar computes its risk-adjusted career viability scores: the model, the weights, the data sources, robustness, and the limitations.",
};

const validation = (data as { meta: { validation?: {
  exposureGrowthSpearman: number;
  exposureQuartileGrowthPct: number[];
} } }).meta.validation;

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
