import Link from "next/link";
import { redirect } from "next/navigation";
import backtest from "@/data/backtest.json";
import { MODELS } from "@/lib/scorer/models";
import { TiltedStar } from "./components/Brand";

const METRICS = (backtest as { metrics: { spearmanScoreVsRealized: number; declinerHitRatePct: number } }).metrics;

// Plain-language line per judge, shared with the rating page's picker.
const JUDGE_PLAIN: Record<string, string> = {
  standard: "the balanced judge — AI risk discounts the reward",
  momentum: "the optimist — growth and pay only, ignores AI on purpose",
  defensive: "the safety-first judge — a career's AI shelter matters most",
  sharpe: "the efficiency judge — reward per unit of risk",
  equal: "the plain average — the baseline the others must beat",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {n}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground/70">{children}</p>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Old shared links pointed the form's state at "/". The form lives at /rate
  // now — forward the whole query so every link ever copied still works.
  const params = await searchParams;
  const legacy = ["careers", "fields", "interests"].filter(
    (k) => typeof params[k] === "string" && (params[k] as string).length > 0,
  );
  if (legacy.length > 0) {
    const p = new URLSearchParams();
    for (const k of legacy) p.set(k, params[k] as string);
    redirect(`/rate?${p.toString()}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-2xl lg:max-w-3xl">
        {/* The promise, and the one action. */}
        <header className="mx-auto max-w-2xl lg:max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Rate the career paths you&rsquo;re weighing — like stocks.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            Picking a career is the biggest bet most of us ever make, and most of the advice is
            vibes. CareerStar treats it like an analyst treats a stock: every U.S. occupation
            gets one{" "}
            <span className="font-semibold text-foreground">0&ndash;100 score</span>{" "}— real
            growth and pay data, discounted by how exposed the work is to AI, blended with how
            well it fits you. No horoscope. Math you can check.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/rate"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Rate my paths →
            </Link>
            <Link href="/explore" className="text-sm font-medium text-blue-600 hover:underline">
              or browse all 730 careers
            </Link>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-foreground/60">
            <span className="inline-flex items-center gap-1">
              <TiltedStar size={11} />
              730 careers rated
            </span>
            <span>· built on real U.S. government data</span>
            <span>· every score is explained, not guessed</span>
          </p>

          {/* The proof, above the fold: tested against a real decade, honest
              about what it got wrong. */}
          <Link
            href="/methodology#backtest"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-600/20 bg-blue-600/[.04] p-3 transition hover:border-blue-600/40 hover:bg-blue-600/[.07]"
          >
            <span aria-hidden className="text-base leading-snug">📜</span>
            <span className="text-xs leading-relaxed text-foreground/75">
              <strong className="font-semibold text-foreground">Tested against a real decade, not vibes.</strong>{" "}
              I scored 2014&rsquo;s careers with 2014 data, then checked what actually happened by
              2024: rank correlation ρ&nbsp;=&nbsp;{METRICS.spearmanScoreVsRealized}, and{" "}
              {METRICS.declinerHitRatePct}% of the careers that really declined were flagged
              (33% by chance). Where it missed, I say so.{" "}
              <span className="font-medium text-blue-600">See the back-test →</span>
            </span>
          </Link>
        </header>

        {/* The idea, in three steps. */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">How it works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Step n={1} title="Name your paths">
              Careers, whole fields, or just your interests — start anywhere, even from
              &ldquo;I don&rsquo;t know yet.&rdquo;
            </Step>
            <Step n={2} title="The math rates each one">
              <strong>Return</strong>{" "}(growth + pay) discounted by{" "}
              <strong>AI risk</strong>, blended with your{" "}
              <strong>fit</strong>{" "}— the same shape as a risk-adjusted return in investing.
              An AI writes the plain-English why, never the number.
            </Step>
            <Step n={3} title="Read the verdict — and the receipts">
              A ranked comparison with stars on a curve, bulls &amp; bears for every career,
              and the exact math behind each score, one click away.
            </Step>
          </div>
        </section>

        {/* The judges — and the fact you can switch them. */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Five judges, not one oracle</h2>
          <p className="mt-3 leading-relaxed text-foreground/70">
            Any single formula is one opinion about how much AI risk should count. So every
            comparison is scored by{" "}
            <strong className="text-foreground">five rival models</strong>{" "}— from
            &ldquo;ignore AI entirely&rdquo; to &ldquo;safety is everything.&rdquo; When they
            agree, that&rsquo;s conviction. When they don&rsquo;t, that&rsquo;s a real finding
            about your choice — and you can{" "}
            <strong className="text-foreground">pick which judge scores your ranking</strong>,
            with each one&rsquo;s strengths and blind spots stated up front.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MODELS.map((m) => (
              <div key={m.id} className="rounded-xl border border-foreground/10 bg-foreground/[.02] p-3 text-xs leading-snug">
                <div className="font-semibold text-foreground/85">{m.name}</div>
                <div className="mt-1 text-foreground/65">{JUDGE_PLAIN[m.id]}</div>
                <div className="mt-1.5 text-emerald-700 dark:text-emerald-400">{"+ "}{m.strengths}</div>
                <div className="mt-0.5 text-amber-700 dark:text-amber-500">{"− "}{m.caution}</div>
              </div>
            ))}
            <div className="flex items-center justify-center rounded-xl border border-dashed border-blue-500/40 bg-blue-500/[.03] p-3 text-center text-xs">
              <Link href="/rate" className="font-semibold text-blue-600 hover:underline">
                Rate your paths, then switch judges live →
              </Link>
            </div>
          </div>
        </section>

        {/* Why trust it — every claim links to its receipt. */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">Why you can check it</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/70">
            <li className="flex gap-2.5">
              <span aria-hidden>🧮</span>
              <span>
                <strong className="text-foreground">Deterministic math.</strong>{" "}The same
                inputs always produce the same score, from formulas published in full on the{" "}
                <Link href="/methodology" className="font-medium text-blue-600 hover:underline">
                  methodology page
                </Link>
                {" "}— including why each line beat its alternatives.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden>📜</span>
              <span>
                <strong className="text-foreground">Back-tested, misses named.</strong>{" "}The
                model was pointed at 2014 and graded against what 2024 actually did — including
                the careers it got wrong, listed by name.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden>⚖️</span>
              <span>
                <strong className="text-foreground">Stress-tested.</strong>{" "}Every comparison
                is re-scored under 729 weight variations and five rival models; results that
                don&rsquo;t survive are flagged as close calls, not sold as verdicts.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden>📂</span>
              <span>
                <strong className="text-foreground">Open data.</strong>{" "}Every rating is in
                one{" "}
                <a href="/careerstar-ratings.csv" download className="font-medium text-blue-600 hover:underline">
                  downloadable CSV
                </a>
                , and the code is on{" "}
                <a
                  href="https://github.com/ashleylibasci/careerstar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  GitHub
                </a>
                . If a number looks wrong, audit it.
              </span>
            </li>
          </ul>
        </section>

        {/* One more door out. */}
        <section className="mt-14 rounded-2xl border border-blue-600/20 bg-blue-600/[.04] p-6 text-center">
          <h2 className="text-lg font-bold tracking-tight">
            Ninety seconds from &ldquo;no idea&rdquo; to a ranked answer.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground/70">
            Free, no sign-up, nothing stored. The worst case is you disagree with the math — and
            you can see all of it.
          </p>
          <Link
            href="/rate"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            Rate my paths →
          </Link>
        </section>
      </div>
    </main>
  );
}
