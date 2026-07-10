import Link from "next/link";
import type { Metadata } from "next";
import data from "@/data/data.json";

export const metadata: Metadata = {
  title: "Case study — how CareerStar was built",
  description:
    "The making of CareerStar: a data-grounded, risk-adjusted career-viability model — the design, the honest bug I caught in my own methodology, and the proof it holds up.",
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
      <article className="w-full max-w-2xl">
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
          CareerStar scores the <strong>viability</strong> of a career in an AI-shaped economy as a
          single 0–100 <em>risk-adjusted</em>{" "}number — the way a portfolio weighs an asset&rsquo;s
          return against its risk. It&rsquo;s a solo summer project, built with an AI-native workflow
          and deployed on AWS. This page is the honest story of how it works and why I trust it.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat big={meta.occupationCount.toLocaleString()} label="occupations, real BLS data" />
          <Stat big={`${meta.skillElements.length}-d`} label="O*NET capability model" />
          <Stat big="729" label="robustness scenarios" />
          <Stat big={`ρ ${meta.validation.exposureGrowthSpearman}`} label="validated thesis" />
        </div>

        <Section kicker="The arc" title="A sequel, not a first draft">
          <p>
            My freshman project was an <strong>AI stock-recommendation engine</strong> — predictive
            models, risk profiles, back-testing. CareerStar is the same machine pointed at a harder,
            more personal question: <em>rates stocks → rates careers.</em>{" "}The framing that makes
            it work is that a career, like an asset, isn&rsquo;t just risky or safe — it&rsquo;s{" "}
            <strong>risk-adjusted</strong>: a field can be exposed to AI and still be worth pursuing
            if its growth, pay, and fit are strong enough.
          </p>
        </Section>

        <Section kicker="The model" title="Every number is math, not an LLM">
          <p>
            A pure, deterministic scorer is the single source of truth. Growth and pay are
            percentile-ranked across all {meta.occupationCount} occupations; risk blends AI-exposure
            research with a constructed volatility proxy; the two combine into a risk-adjusted value,
            then blend with personal fit:
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

        <Section kicker="The honest part" title="I caught my own model overclaiming — and fixed it">
          <div className="rounded-2xl border-l-4 border-blue-500 bg-blue-500/[.06] p-4 text-foreground/80">
            My methodology page said &ldquo;Fit = O*NET skill-vector similarity.&rdquo; When I
            actually read my own data, it wasn&rsquo;t — Fit was a keyword match dressed up in the
            language of a vector model. The page made a claim the code didn&rsquo;t keep.
          </div>
          <p>
            So I rebuilt it for real. Each occupation now carries a genuine{" "}
            <strong>{meta.skillElements.length}-dimensional O*NET capability vector</strong> — 35
            skills + 33 knowledge areas — and Fit is cosine similarity in that space,{" "}
            <strong>weighted by how distinctive each capability is across the labor market</strong>{" "}
            (a per-dimension z-score), because otherwise the skills every job shares drown out the
            ones that actually differentiate them. The redirect to a &ldquo;stronger adjacent
            path&rdquo; is a true nearest-neighbor in that same space.
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

        <Section kicker="The proof" title="Robust to ±20%, and the risk axis isn't redundant">
          <p>
            <strong>Robustness.</strong> The weights are a modeling choice, so the fair question is
            whether the answer survives disagreement about them. Every comparison is re-scored across{" "}
            <strong>729 weightings</strong> — every weight moved ±20% on a fixed grid — and the app
            reports how often each career keeps its rank, flagging a &ldquo;close call&rdquo; instead
            of selling a shaky #1 as certain.
          </p>
          <p>
            <strong>Validation.</strong> A fair objection is that AI-exposure just restates
            &ldquo;declining.&rdquo; It doesn&rsquo;t: across all {meta.occupationCount} occupations,
            exposure and projected growth are almost uncorrelated (Spearman ρ&nbsp;=&nbsp;
            {meta.validation.exposureGrowthSpearman}; exposure-quartile growth is flat —{" "}
            {meta.validation.exposureQuartileGrowthPct.map((g, i) => `Q${i + 1} ${g}%`).join(", ")}).
            So the risk axis carries information growth doesn&rsquo;t — which is exactly why a
            risk-<em>adjusted</em> score beats ranking on growth alone, and why
            &ldquo;exposure&nbsp;≠&nbsp;displacement&rdquo; is literally true in the data.
          </p>
        </Section>

        <Section kicker="How it was built" title="Solo, one summer, AI-native, on AWS">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>One person</strong>, one summer — from brief to PRD to architecture to build, using a structured AI-native (BMAD) workflow.</li>
            <li><strong>Real public data</strong>: U.S. BLS Employment Projections, O*NET 29.0 (skills + knowledge), Eloundou et al. AI-exposure, and College Scorecard for the education-ROI layer.</li>
            <li><strong>Deterministic &amp; stateless</strong>: no database, no accounts, no stored input — the whole model is a committed data file + pure functions.</li>
            <li><strong>Deployed on AWS Amplify</strong> with CI/CD, HTTPS, security headers, rate limiting, and prompt-injection-resistant LLM use.</li>
          </ul>
        </Section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
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
