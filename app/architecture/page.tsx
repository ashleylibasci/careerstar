import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it's built — CareerStar",
  description:
    "CareerStar's system architecture: an offline data pipeline, a deterministic scorer, an LLM explanation layer, and the decisions behind them.",
};

const DECISIONS: { id: string; rule: string; prevents: string }[] = [
  { id: "AD-1", rule: "One Next.js app, TypeScript end-to-end", prevents: "a needless second service and its ops surface" },
  { id: "AD-2", rule: "The scorer is one pure module; the UI only renders", prevents: "two sources of truth for a score drifting apart" },
  { id: "AD-3", rule: "Data is joined offline, read at runtime", prevents: "slow, fragile in-request data joins" },
  { id: "AD-4", rule: "The LLM explains; it never computes the score", prevents: "the thin-wrapper failure — an LLM guess mistaken for the verdict" },
  { id: "AD-5", rule: "Free-text is treated as data, not instructions", prevents: "prompt injection, cost abuse, and leaked secrets" },
  { id: "AD-6", rule: "Stateless — no accounts, no database", prevents: "data-governance and auth surface the MVP doesn't need" },
  { id: "AD-7", rule: "Deployed on AWS Amplify + Route 53, auto HTTPS", prevents: "ops sprawl and insecure configuration" },
];

const FLOW = [
  { stage: "Offline pipeline", detail: "BLS + O*NET-SOC + Eloundou AI-exposure, joined on a machine into a committed data.json" },
  { stage: "Security gate", detail: "input validation, length caps, rate limiting" },
  { stage: "Deterministic scorer", detail: "risk-adjusted 0–100 score — pure, unit-tested, the single source of truth" },
  { stage: "LLM explanation", detail: "Claude explains the computed score in one sentence — never computes it" },
  { stage: "Result cards", detail: "score, component breakdown, and a redirect to a stronger path" },
];

export default function ArchitecturePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to CareerStar
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">How CareerStar is built</h1>
        <p className="mt-3 text-foreground/70">
          A single full-stack Next.js app with a deterministic scoring engine at its core.
          An LLM explains the score; it never computes it. Free-text is treated as data,
          not instructions. Stateless, no database, deployed on AWS with CI/CD.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">The flow</h2>
          <ol className="mt-4 space-y-2">
            {FLOW.map((f, i) => (
              <li
                key={f.stage}
                className="flex gap-3 rounded-xl border border-foreground/10 bg-foreground/[.02] p-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold">{f.stage}</div>
                  <div className="text-sm text-foreground/60">{f.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">
            The decisions <span className="text-foreground/40">— and what each prevents</span>
          </h2>
          <div className="mt-4 space-y-2">
            {DECISIONS.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-foreground/10 p-3 text-sm"
              >
                <span className="font-bold text-blue-600">{d.id}</span>{" "}
                <span className="font-medium">{d.rule}</span>
                <div className="text-foreground/55">Prevents {d.prevents}.</div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-xs text-foreground/50">
          Stack: Next.js 16 (App Router, TypeScript) · Claude for explanations · data from
          BLS &amp; the Eloundou 2023 AI-exposure study · deployed on AWS Amplify.
        </p>
      </article>
    </main>
  );
}
