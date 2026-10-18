import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";
import backtest from "@/data/backtest.json";
import ScoringPipelineDiagram from "@/app/components/ScoringPipelineDiagram";
import PageExplainer from "@/app/components/PageExplainer";

export const metadata: Metadata = {
  title: "Case study — how CareerStar was built",
  description:
    "The making of CareerStar: a data-grounded, risk-adjusted career-viability model — the design, the honest bug I caught in my own methodology, and the proof it holds up.",
  alternates: { canonical: "/case-study" },
};

const meta = (data as {
  meta: { occupationCount: number; skillElements: string[]; validation: { exposureGrowthSpearman: number; exposureQuartileGrowthPct: number[] } };
}).meta;

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4 text-center">
      <div className="text-2xl font-bold tracking-tight tabular-nums text-blue-600">{big}</div>
      <div className="mt-1 text-xs text-foreground/60">{label}</div>
    </div>
  );
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">{kicker}</div>
      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/75">{children}</div>
    </section>
  );
}

export default function CaseStudyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl lg:max-w-3xl">
        {/* Hero */}
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-600">Case study</div>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          I built a model that rates careers like stocks — then caught it lying, and fixed it.
        </h1>
        <p className="mt-3 text-sm text-foreground/60">
          by <span className="font-semibold text-foreground/80">Ashley Libasci</span> — Math + CS @ UIUC ·{" "}
          <a href="https://github.com/ashleylibasci/careerstar" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            GitHub
          </a>{" "}
          ·{" "}
          <a href="https://www.linkedin.com/in/ashleylibasci/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            LinkedIn
          </a>
        </p>
        <p className="mt-4 text-base leading-relaxed text-foreground/70">
          CareerStar gives every U.S. career a single 0&ndash;100 score for how{" "}
          <strong>viable</strong>{" "}it is in an economy AI is reshaping — the payoff (growth and
          pay), marked down by the risk that AI eats the work, the same way an investor marks
          down a promising-but-risky stock. It&rsquo;s a solo summer project, built with an
          AI-native workflow and deployed on AWS. This page is the story of how it works and why
          I trust it.
        </p>

        <PageExplainer>
          <p>
            This is the story behind the product — how the model was designed, the bug I caught in
            my own methodology (and chose to disclose rather than hide), and the evidence that the
            scores hold up. It&rsquo;s written for anyone deciding whether to trust the site,
            including recruiters kicking the tires.
          </p>
          <p>
            <strong>How to use it:</strong>{" "}read top to bottom like an essay — or jump straight to
            the pipeline diagram if you just want to see how a number gets made.
          </p>
        </PageExplainer>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat big={meta.occupationCount.toLocaleString()} label="occupations, real U.S. government data" />
          <Stat big={`${meta.skillElements.length}`} label="abilities measured per career" />
          <Stat big="729" label="stress-test re-runs per comparison" />
          <Stat big={`${backtest.metrics.spearmanScoreVsRealized}`} label="score-vs-reality link, tested on 2014→2024 (0 = none, 1 = perfect)" />
        </div>

        <Section kicker="The arc" title="A sequel, not a first draft">
          <p>
            My freshman project was an <strong>AI stock-recommendation engine</strong> — predictive
            models, risk profiles, testing against past market data. CareerStar is the same machine
            pointed at a harder, more personal question: <em>rates stocks → rates careers.</em>{" "}
            The idea that makes it work: a career isn&rsquo;t simply &ldquo;risky&rdquo; or
            &ldquo;safe.&rdquo; What matters is whether the payoff justifies the risk — a field
            can be exposed to AI and still be worth pursuing if its growth, pay, and fit are
            strong enough, just as a risky stock can still belong in a portfolio.
          </p>
        </Section>

        {/* The differentiator leads — a skimming recruiter should hit the
            caught-my-own-bug story before the (more generic) model tour. */}
        <Section kicker="The honest part" title="I caught my own model overclaiming — and fixed it">
          <div className="rounded-2xl border-l-4 border-blue-500 bg-blue-500/[.06] p-4 text-foreground/80">
            My methodology page said &ldquo;Fit = O*NET skill-vector similarity.&rdquo; When I
            actually read my own data, it wasn&rsquo;t — Fit was a keyword match dressed up in the
            language of a vector model. The page made a claim the code didn&rsquo;t keep.
          </div>
          <p>
            So I rebuilt it for real. Every occupation now carries its genuine government skill
            profile — the U.S. Department of Labor rates each job on the same{" "}
            {meta.skillElements.length} abilities (35 skills + 33 knowledge areas) — and Fit
            measures how closely your interests line up with that profile,{" "}
            <strong>counting rare abilities more than common ones</strong>, because the skills
            every job shares (reading, critical thinking) would otherwise drown out the ones that
            actually make jobs different. When the app suggests &ldquo;you might prefer this
            adjacent career instead,&rdquo; that suggestion now really is the closest career by
            skill profile — not a guess.
          </p>
          <p className="text-foreground/60">
            The point isn&rsquo;t that I wrote a bug. It&rsquo;s that I went looking for where my own
            model was weakest, found it, and made the claim true instead of quietly deleting it.
            Don&rsquo;t take my word for it — the{" "}
            <a
              href="https://github.com/ashleylibasci/careerstar/blob/main/_bmad-output/planning-artifacts/reconciliation-2026-07-09.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              full reconciliation document
            </a>{" "}
            is committed in the repo, verdict by verdict.
          </p>
        </Section>

        <Section kicker="The model" title="Every number is math, not an LLM">
          <p>
            One fixed formula is the single source of truth — the same inputs always give the
            same score, and no AI is involved in computing it. Each career&rsquo;s growth and pay
            are ranked against all {meta.occupationCount} occupations; risk combines published
            AI-exposure research with a stand-in for career instability; reward gets marked down
            by risk, and the result blends with personal fit:
          </p>
          {/* Two altitudes of the same claim: the system view for skimmers, then
              the raw equations verbatim for anyone who wants to verify. */}
          <figure className="my-5 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4 sm:p-5">
            <ScoringPipelineDiagram />
          </figure>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            The actual equations
          </p>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-foreground/[.03] p-4 text-xs leading-relaxed">
{`Return = wGrowth·growth + wPay·pay
Risk   = wExposure·exposure + wVolatility·volatility
RAV    = Return · (1 − γ·Risk)
Score  = 100 · [ α·RAV + (1 − α)·Fit ]`}
          </pre>
          <p>
            The language model never computes a number. It only writes the plain-English
            &ldquo;why,&rdquo; from the already-computed score — and it never even sees your raw
            text, only controlled tags. The math is auditable; the AI is a narrator.
          </p>
        </Section>

        <Section kicker="The receipt" title="Back-tested against a real decade">
          <p>
            The strongest evidence isn&rsquo;t a formula — it&rsquo;s history. I recovered the
            government&rsquo;s <strong>original 2014 career forecasts</strong>{" "}from the
            Internet Archive, had the model score the 2014 labor market using only what was
            knowable then, and compared against what actually happened by 2024 —{" "}
            <strong>647 occupations across a real decade</strong>. Careers it scored higher
            really did fare better, and it flagged 48% of the careers that went on to shrink
            where guessing would catch 33%. And the part a marketer would cut: the AI-risk
            penalty added <em>nothing</em>{" "}for that decade — exactly as it should, because
            2014&ndash;24 ended before ChatGPT, and the AI-exposure number is a bet about the
            future that a test on the past can&rsquo;t score. The misses are published by name,
            including the oil-crash casualties no career-by-career model catches.
          </p>
        </Section>

        <Section kicker="The proof" title="Robust to ±20%, and the risk axis isn't redundant">
          <p>
            <strong>Does the answer survive disagreement?</strong>{" "}The model&rsquo;s weights
            are choices, so every comparison is re-run <strong>729 times</strong>{" "}with each
            weight nudged 20% up and down in every combination. The app reports how often each
            career keeps its place, flagging a &ldquo;close call&rdquo; instead of selling a
            shaky #1 as certain.
          </p>
          <p>
            <strong>Is the AI-risk number redundant?</strong>{" "}A fair objection is that
            &ldquo;exposed to AI&rdquo; might just be another way of saying &ldquo;already
            declining.&rdquo; It isn&rsquo;t: across all {meta.occupationCount} occupations,
            knowing a career&rsquo;s AI exposure tells you almost nothing about whether
            it&rsquo;s projected to grow or shrink — the two are nearly unrelated in the data
            (correlation {meta.validation.exposureGrowthSpearman}, where 0 means no relationship).
            So the risk number carries real information the growth forecast doesn&rsquo;t, which
            is why the score adjusts for it instead of ranking on growth alone.
          </p>
        </Section>

        <Section kicker="Model risk" title="Five models, not one — because a formula is an opinion">
          <p>
            The deepest critique of any scoring app is: <em>who says your formula is right?</em>{" "}My
            answer is to stop pretending there&rsquo;s one formula. Every comparison is also scored
            under <strong>four rival models</strong>{" "}— an optimist that ignores AI risk
            entirely, a safety-first model that cares most about shelter from AI, one that asks
            how much reward you get per unit of risk, and a plain average of everything — and the
            app shows the spread. When all five agree, the ranking isn&rsquo;t an artifact of my
            assumptions. When they crown different winners, the app says so, because{" "}
            <strong>that disagreement is the answer</strong>: your choice turns on
            how much AI risk you believe in, and no formula can settle that for you.
          </p>
          <p className="text-foreground/60">
            (The plain average is there on purpose: if a clever model can&rsquo;t beat a simple
            average, its complexity isn&rsquo;t earning its keep — a lesson borrowed from
            investing research.)
          </p>
        </Section>

        <Section kicker="How it was built" title="Solo, one summer, AI-native, on AWS">
          <div className="flex flex-wrap gap-2">
            {[
              "32 unit tests",
              "CI on every push",
              "deterministic scorer",
              "stateless — no DB, nothing stored",
              "rate-limited + security headers",
              "injection-resistant by construction",
            ].map((t) => (
              <span key={t} className="rounded-full border border-foreground/10 bg-foreground/[.03] px-3 py-1 text-xs font-medium text-foreground/70">
                ✓ {t}
              </span>
            ))}
          </div>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>One person</strong>, one summer — from brief to PRD to architecture to build, using a structured AI-native (BMAD) workflow.</li>
            <li><strong>Real public data</strong>: U.S. BLS Employment Projections, O*NET 29.0 (skills + knowledge), Eloundou et al. AI-exposure, and College Scorecard for the education-ROI layer.</li>
            <li><strong>Deterministic &amp; stateless</strong>: no database, no accounts, no stored input — the whole model is a committed data file + pure functions.</li>
            <li><strong>Deployed on AWS Amplify</strong>{" "}with CI/CD, HTTPS, security headers, rate limiting, and prompt-injection-resistant LLM use.</li>
          </ul>
        </Section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/rate" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Try the rating engine →
          </Link>
          <Link href="/methodology" className="rounded-2xl border border-foreground/15 px-5 py-3 text-sm font-semibold hover:border-blue-500/50">
            Read the full methodology
          </Link>
          <Link href="/architecture" className="rounded-2xl border border-foreground/15 px-5 py-3 text-sm font-semibold hover:border-blue-500/50">
            See the architecture
          </Link>
          <a
            href="https://github.com/ashleylibasci/careerstar"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-foreground/15 px-5 py-3 text-sm font-semibold hover:border-blue-500/50"
          >
            Read the code ↗
          </a>
        </div>
      </article>
    </main>
  );
}
