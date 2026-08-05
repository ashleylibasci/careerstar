import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";
import backtest from "@/data/backtest.json";
import PageExplainer from "@/app/components/PageExplainer";
import { computeScores } from "@/lib/scorer/scorer";
import { MODELS } from "@/lib/scorer/models";
import type { Occupation } from "@/lib/scorer/types";

export const metadata: Metadata = {
  title: "Methodology — CareerStar",
  description:
    "How CareerStar computes its risk-adjusted career viability scores: the model, the weights, the data sources, robustness, and the limitations.",
  alternates: { canonical: "/methodology" },
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

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-20">
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
      <article className="w-full max-w-2xl lg:max-w-3xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to CareerStar
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">How scores are calculated</h1>
        <p className="mt-3 text-foreground/70">
          CareerStar sizes up a career the way an investor sizes up a stock — what&rsquo;s the
          payoff, what&rsquo;s the risk — and blends the result with how well the path fits you.
          Everything below is plain arithmetic: the same inputs always produce the same score,
          and no AI ever computes a number. This page walks through all of it.
        </p>

        <PageExplainer>
          <p>
            This page is the math behind every CareerStar score — the full model, its weights, the
            data sources, and the tests it was put through, written so you can check the work
            rather than take my word for it.
          </p>
          <p>
            <strong>How to use it:</strong>{" "}skim the section headings and stop where you&rsquo;re
            skeptical. If you only read one section, read the back-test — it shows how the model
            fared against a real decade, including what it got wrong.
          </p>
        </PageExplainer>

        {/* Eleven sections is a corridor; this is the row of doors. */}
        <nav aria-label="On this page" className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/55">On this page</div>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {[
              ["#model", "The model — and why each line"],
              ["#fit", "How Fit is measured"],
              ["#moat", "The AI-moat rating"],
              ["#universe", "What the rated universe looks like"],
              ["#robustness", "Robustness"],
              ["#models", "Five rival models"],
              ["#sources", "Data sources"],
              ["#exposure", "Is exposure just decline? (no)"],
              ["#backtest", "The back-test: 2014 → 2024"],
              ["#data", "Check my math — the data"],
              ["#limitations", "Limitations"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-blue-600 hover:underline">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="model" title="The model">
          <p>
            Each occupation gets a 0–100 score built from <strong>five measured
            ingredients</strong>. Every ingredient is converted to a number between 0 and 1
            before any arithmetic happens — 0 meaning the bottom of the range, 1 the top —
            so that things measured in different units (percent growth, dollars of pay) can
            be combined at all. The five, and where each number comes from:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>growth</strong>{" "}— the U.S. Bureau of Labor Statistics&rsquo; projected
              employment growth for this occupation over 2024&ndash;2034, expressed as a{" "}
              <em>percentile rank</em>{" "}against all {typed.occupations.length}{" "}occupations in
              the set. A growth of 0.92 means &ldquo;projected to grow faster than 92% of all
              careers&rdquo; — not 92% growth.
            </li>
            <li>
              <strong>pay</strong>{" "}— the occupation&rsquo;s median annual pay (also BLS), as
              the same kind of percentile rank. 0.50 means the pay is exactly in the middle of
              all careers.
            </li>
            <li>
              <strong>exposure</strong>{" "}— the estimated share of the job&rsquo;s tasks that AI
              could meaningfully perform or speed up, taken from a published research dataset
              (Eloundou et al. 2023 — see data sources). It already arrives as a 0&ndash;1
              number: 0.8 means roughly 80% of the job&rsquo;s tasks are AI-touchable.
              (Touchable, not doomed — a task AI can help with is not a job that disappears.)
            </li>
            <li>
              <strong>volatility</strong>{" "}— a stand-in for how unstable the field is. No public
              dataset measures this directly, so it&rsquo;s built from the growth number:
              volatility&nbsp;=&nbsp;1&nbsp;−&nbsp;growth. A field at the 10th percentile for
              growth (i.e. shrinking relative to others) gets volatility 0.90 — a shrinking
              field is treated as a riskier place to stand.
            </li>
            <li>
              <strong>Fit</strong>{" "}— how well the occupation&rsquo;s real skill profile matches
              the interests you typed in, from 0 (no overlap) to 1 (strong match), measured in
              O*NET capability-space (explained in the next section).
            </li>
          </ul>
          <p>Those five ingredients feed four lines of arithmetic:</p>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`Return = wGrowth·growth + wPay·pay
Risk   = wExposure·exposure + wVolatility·volatility
RAV    = Return · (1 − γ·Risk)          (risk-adjusted return)
Score  = 100 · [ α·RAV + (1 − α)·Fit ]`}
          </pre>
          <p>
            Everything else in those lines — the w&rsquo;s, the Greek letters — is a{" "}
            <strong>weight</strong>: a fixed number that says how much an ingredient counts.
            They look mysterious, but each is just a name for one number, and here they all are,
            straight from the code:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>wGrowth&nbsp;=&nbsp;0.5, wPay&nbsp;=&nbsp;0.5</strong>{" "}— Return is a plain
              50/50 average of the growth rank and the pay rank. Neither is favored.
            </li>
            <li>
              <strong>wExposure&nbsp;=&nbsp;0.7, wVolatility&nbsp;=&nbsp;0.3</strong>{" "}— Risk is
              70% AI exposure, 30% volatility. Why exposure dominates is argued below.
            </li>
            <li>
              <strong>γ (&ldquo;gamma&rdquo;)&nbsp;=&nbsp;0.6</strong>{" "}— how hard risk is
              allowed to punish return. In line three, a career&rsquo;s Return gets multiplied
              by (1&nbsp;−&nbsp;0.6·Risk): at zero risk nothing is lost, and even at the maximum
              possible risk (Risk&nbsp;=&nbsp;1) the career keeps 40% of its Return. RAV —{" "}
              <em>risk-adjusted return</em>{" "}— is just the name for Return after this
              discount.
            </li>
            <li>
              <strong>α (&ldquo;alpha&rdquo;)&nbsp;=&nbsp;0.7</strong>{" "}— the final blend: the
              score is 70% market reality (RAV) and 30% personal fit. Since RAV and Fit are both
              0&ndash;1 numbers, multiplying the blend by 100 is what makes the familiar 0&ndash;100
              score.
            </li>
          </ul>
          <p>A worked example, start to finish. Take a career that ranks at the 90th
            percentile for growth and the 70th for pay, has AI exposure 0.50, and matches your
            interests at Fit&nbsp;=&nbsp;0.60:</p>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`Return     = 0.5·0.90 + 0.5·0.70        = 0.80
volatility = 1 − 0.90                   = 0.10
Risk       = 0.7·0.50 + 0.3·0.10        = 0.38
RAV        = 0.80 · (1 − 0.6·0.38)      = 0.62
Score      = 100 · (0.7·0.62 + 0.3·0.60) ≈ 61`}
          </pre>
          <p>
            Four short lines, but each one is a decision, and each had an obvious
            alternative I turned down:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Percentile ranks, not raw units.</strong>{" "}Growth is a percent and pay is
              dollars, so you can&rsquo;t average them directly. Instead, each career is ranked
              against all {typed.occupations.length}{" "}others — &ldquo;92nd percentile for
              pay&rdquo; — which also means a score never says a career is good in the abstract.
              It says how the career stacks up against everything else you could pick, which is
              the decision you&rsquo;re actually making. The obvious alternative — stretching
              raw values onto a ruler running from the smallest to the largest — would let one
              extreme career (surgeons&rsquo; pay) squash every other career into the bottom of
              the scale.
            </li>
            <li>
              <strong>Risk discounts return; it isn&rsquo;t subtracted.</strong>{" "}RAV multiplies:
              Return&nbsp;·&nbsp;(1&nbsp;−&nbsp;γ·Risk). Subtracting risk would let a safe
              dead-end career outrank a risky booming one purely on safety. Multiplying makes
              risk matter in proportion to what&rsquo;s at stake — the same logic as a
              risk-adjusted return in investing. And γ&nbsp;=&nbsp;0.6 caps the damage: even
              maximum risk erases at most 60% of a career&rsquo;s return, never all of it.
            </li>
            <li>
              <strong>Exposure dominates risk (0.7 vs 0.3)</strong>{" "}because AI disruption is the
              question this site exists to ask — and because the volatility term is the weaker
              measurement, a constructed proxy (see limitations). The weaker measurement gets the
              minority weight.
            </li>
            <li>
              <strong>Market outweighs fit (α&nbsp;=&nbsp;0.7)</strong>{" "}because this is a
              viability rating that gets personalized, not a personality quiz with salary data
              sprinkled on. Reality carries the score; your interests tilt it.
            </li>
          </ul>
          <p>
            Now the honest part: nothing proves these particular weights are correct. There is
            no answer key of &ldquo;right career choices&rdquo; to tune them against, so 0.7 and
            0.6 are judgment calls — written down in the code for anyone to read, not hidden.
            That&rsquo;s why so much of this page is stress-testing: every comparison is re-run
            729 times with the weights nudged in every direction, five rival formulas score it
            under different philosophies entirely, and the model was graded against a real
            decade of history. I can&rsquo;t prove my weights are right, so I show you what
            happens when they&rsquo;re wrong.
          </p>
        </Section>

        <Section id="fit" title="How Fit is measured">
          <p>
            The U.S. Department of Labor&rsquo;s O*NET database rates every occupation on the
            same checklist of <strong>68 abilities</strong>: 35 <em>skills</em>{" "}(Critical
            Thinking, Programming, Mathematics…) and 33 <em>knowledge areas</em>{" "}(Economics
            &amp; Accounting, Engineering, Medicine, Law…), each scored by how important it is to
            that job. So every career comes with a 68-number profile of what the work actually
            demands.
          </p>
          <p>
            When you type in your interests, CareerStar translates them onto that same
            68-item checklist using a fixed, published word list (&ldquo;coding&rdquo; maps to
            Programming, &ldquo;helping people&rdquo; maps to Social Perceptiveness, and so on).
            Fit is then simply how much your profile and the career&rsquo;s profile overlap.
          </p>
          <p>
            One subtlety matters. Nearly every professional job rates high on the common
            abilities — reading, speaking, critical thinking — so raw overlap would make every
            office job look like a match for everyone. To fix that, CareerStar counts a match on a{" "}
            <strong>rare</strong>{" "}ability (one few other jobs demand, like Medicine or
            Programming) far more heavily than a match on one every job shares. That&rsquo;s what
            lets fit tell finance from engineering, not just desk-work from the trades. It&rsquo;s
            still a modeling choice, and I say so — two similar fields can both score high.
          </p>
        </Section>

        <Section id="moat" title="The AI-moat rating">
          <p>
            A <strong>moat</strong>{" "}is the water around a castle — investors (Morningstar,
            most famously) use the word for how well a company can defend its position. CareerStar
            borrows it for careers: how defensible is this work against AI? The rating comes from
            a fixed formula, not a judgment call, built from two questions:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>How much of the work can AI touch?</strong>{" "}(the same 0&ndash;1 exposure
              number from the score — low exposure is shelter)
            </li>
            <li>
              <strong>Are the career&rsquo;s defining abilities rare?</strong>{" "}A job built on
              abilities few other jobs demand (surgery, say) is harder to substitute than one
              built on abilities every job shares.
            </li>
          </ul>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`defensibility = 0.6·(shelter from AI) + 0.4·(rarity of its top abilities)

Wide moat   = top ~20% of careers on defensibility
Narrow moat = middle ~50%
No moat     = bottom ~30%`}
          </pre>
          <p>
            The cutoff lines between wide, narrow, and none were set once, on the full
            730-career distribution, and then frozen — they don&rsquo;t move to make any career
            look better. The model makes uncomfortable calls: it gives software developers{" "}
            <strong>no moat</strong>{" "}(AI can already touch most of their tasks) even though
            their overall <em>score</em>{" "}stays high — and I ship those calls rather than tune
            them away. For 25 newer occupation codes O*NET hasn&rsquo;t rated yet (software
            developers among them), the ability profile is{" "}
            <strong>estimated from closely related occupations</strong>{" "}and flagged as an
            estimate in the data.
          </p>
          <p>
            Score uncertainty is also stated in words on every card — Low (±5 or less), Medium
            (±6–8), High (±9–10), Very high (±11+) — wider with high AI exposure or weak fit.
          </p>
        </Section>

        <Section id="universe" title="What the rated universe looks like">
          <p>
            Here is how all {typed.occupations.length} occupations actually spread out under the
            default settings — how many land in each score range, and how many get each moat
            rating. (Star ratings are graded on a curve on top of these scores, the way a
            professor curves grades: the top slice of careers gets five stars regardless of the
            raw number.)
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

        <Section id="robustness" title="Robustness (does the answer survive?)">
          <p>
            The weights above are a deliberate choice, so the fair test is whether the answer
            survives when you disagree with them. For every comparison, CareerStar re-runs the
            whole calculation <strong>729 times</strong>: each of the six weights is tried at
            three settings — as chosen, 20% higher, and 20% lower — and 3 × 3 × 3 × 3 × 3 × 3
            makes 729 combinations. Then it reports how often each career keeps its place in the
            ranking. A result that holds across all 729 runs is solid; one that shuffles is
            flagged as a <em>close call</em>{" "}rather than sold as a verdict. You can watch this
            live by moving the sliders on the results screen.
          </p>
        </Section>

        <Section id="models" title="Five rival models (model risk, made visible)">
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
            One of the five is deliberately dumb: it just averages everything, equally.
            It&rsquo;s there as a baseline — if a fancier model can&rsquo;t beat a plain
            average, all its extra machinery is doing nothing.
          </p>
        </Section>

        <Section id="sources" title="Data sources">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Growth &amp; pay</strong>{" "}— U.S. Bureau of Labor Statistics,
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
          <Section id="exposure" title="Does “AI exposure” just mean “decline”?">
            <p>
              A fair objection: maybe the AI-exposure number is redundant — maybe the exposed
              jobs are simply the shrinking ones, and growth already tells the whole story. The
              data says no. Across all {(data as { meta: { occupationCount: number } }).meta.occupationCount}{" "}
              occupations, knowing a job&rsquo;s AI exposure tells you almost nothing about
              whether it&rsquo;s projected to grow or shrink — the two are nearly unrelated.
              (Statistically: the correlation is {validation.exposureGrowthSpearman} on a scale
              where 0 means &ldquo;no relationship at all&rdquo; and 1 means &ldquo;perfectly
              linked.&rdquo;) Split all jobs into four buckets from least- to most-exposed, and
              average projected growth is about the same in every bucket —{" "}
              {validation.exposureQuartileGrowthPct.map((g, i) =>
                `${g}%`).join(", ")} from least to most exposed — no downward slide.
            </p>
            <p>
              So AI exposure captures something the growth forecast doesn&rsquo;t. That&rsquo;s
              why the score adjusts for it instead of just ranking careers by growth — and why
              &ldquo;exposed to AI&rdquo; really doesn&rsquo;t mean &ldquo;doomed to shrink&rdquo;
              in this data. (This isn&rsquo;t left as an assertion, either — the model was run
              against a real decade of history. See the next section.)
            </p>
          </Section>
        )}

        <Section id="backtest" title="The back-test: 2014 → 2024, a real decade">
          <p>
            A <strong>back-test</strong>{" "}is how you check a model without waiting ten years:
            rewind the clock, let the model make its calls using only what was knowable then,
            and grade it against what actually happened. So I dug the government&rsquo;s
            official 2014 career forecasts out of an internet archive, had the model score the{" "}
            <strong>2014 labor market</strong>{" "}using only that 2014 information, and then
            compared its scores against <strong>what actually happened by 2024</strong> —{" "}
            {backtest.meta.joined} occupations tracked across the decade.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.spearmanScoreVsRealized}</div>
              <div className="mt-1 text-xs text-foreground/60">link between 2014 score and what happened (0 = none, 1 = perfect)</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.declinerHitRatePct}%</div>
              <div className="mt-1 text-xs text-foreground/60">of the careers that shrank were flagged (guessing gets 33%)</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.medianScoreDecliners} vs {backtest.metrics.medianScoreGrowers}</div>
              <div className="mt-1 text-xs text-foreground/60">typical 2014 score of careers that shrank vs ones that grew</div>
            </div>
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-blue-600">{backtest.metrics.spearmanExposureVsRealized}</div>
              <div className="mt-1 text-xs text-foreground/60">AI exposure&rsquo;s link to that decade (expected ≈ 0 — it was pre-ChatGPT)</div>
            </div>
          </div>
          <p>
            Read it honestly. Careers the model scored higher in 2014 really did fare better
            over the decade — the link between score and outcome was{" "}
            {backtest.metrics.spearmanScoreVsRealized} on that 0-to-1 scale, solidly above zero
            but far from prophecy. And it flagged {backtest.metrics.declinerHitRatePct}% of the
            careers that went on to shrink, roughly one and a half times better than guessing.
            One wrinkle I&rsquo;m not going to bury: the government&rsquo;s raw growth forecast alone did{" "}
            <em>slightly better</em>{" "}({backtest.metrics.spearmanBlsProjectionVsRealized}) than
            the full model. Why? Because the model&rsquo;s AI-risk adjustment did nothing for
            that particular decade — 2014&ndash;24 ended before ChatGPT changed anything, so
            penalizing AI-exposed careers couldn&rsquo;t help yet. That&rsquo;s the model working
            as designed: AI exposure is a bet about the <em>future</em>, and a test run on the
            past can&rsquo;t score it. The back-test proves out the part of the model history can
            test, and is upfront about the part it can&rsquo;t.
          </p>
          <p>
            The misses, named: the model liked oil-and-gas roles in 2014 (
            {backtest.biggestMisses[2].title.toLowerCase()}, score{" "}
            {backtest.biggestMisses[2].score2014}) that fell{" "}
            {Math.abs(backtest.biggestMisses[2].realizedPct)}% when oil prices crashed — the
            kind of economy-wide shock no career-by-career model can see coming. And it
            under-rated couriers (+166% on the e-commerce boom). A few of the wildest swings are
            bookkeeping rather than reality — the government occasionally renames or regroups
            occupations between decades, which can make a career look like it exploded or
            vanished. Full numbers, misses, and false alarms:{" "}
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

        <Section id="data" title="Check my math — download the data">
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
            flag for the 25 careers whose capability vectors are estimated. If a number
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

        <Section id="limitations" title="Limitations (read these)">
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
              <strong>Fit is a model, not a verdict.</strong> It uses the government&rsquo;s real
              skill data, but the word list that translates your interests onto that skill
              checklist was written by hand, so fit is a defensible estimate — and two similar
              fields (say finance and engineering) can score alike.
            </li>
            <li>
              <strong>The volatility number is a stand-in.</strong> Nobody publishes a direct
              measure of how unstable each career is, so this model uses the best available
              substitute: treating shrinking fields as less stable ones.
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
