import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — CareerStar",
  description:
    "How CareerStar computes its risk-adjusted career viability scores: the model, the weights, the data sources, and the limitations.",
};

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
              <strong>Fit</strong> — the share of your stated interests the occupation matches.
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

        <Section title="Data sources">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Growth &amp; pay</strong> — U.S. Bureau of Labor Statistics,
              Occupational Outlook Handbook (public domain).
            </li>
            <li>
              <strong>AI exposure</strong> — Eloundou et al. 2023, “GPTs are GPTs”
              (occupation-level exposure, β measure; MIT-licensed).
            </li>
            <li>Occupations are keyed by O*NET-SOC code.</li>
          </ul>
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
              <strong>MVP data.</strong> This early version covers a curated set of
              CS/STEM/quant/finance occupations, and the BLS figures are approximate
              (~2023) pending verification.
            </li>
            <li>
              <strong>The volatility term is a proxy.</strong> No public dataset measures
              career volatility directly, so it is constructed from projected growth.
            </li>
          </ul>
        </Section>

        <p className="mt-12 text-xs text-foreground/50">
          Built with an AI-native workflow. The language model only writes the plain-English
          explanations — it never computes a score.
        </p>
      </article>
    </main>
  );
}
