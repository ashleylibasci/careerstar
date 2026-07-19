import Link from "next/link";
import backtest from "@/data/backtest.json";
import CareerForm from "./components/CareerForm";
import PageExplainer from "./components/PageExplainer";

const METRICS = (backtest as { metrics: { spearmanScoreVsRealized: number; declinerHitRatePct: number } }).metrics;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-2xl">
        <header className="mb-10 mx-auto max-w-2xl print:hidden">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Rate the career paths you&rsquo;re weighing — like stocks.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            One{" "}
            <span className="font-semibold text-foreground">0&ndash;100 score</span>{" "}
            for how strong a bet each career is — its growth and pay weighed against AI risk, the
            way you&rsquo;d size up a stock. Tell it what you&rsquo;re considering and what
            interests you.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-foreground/60">
            <span>★ 730 careers rated</span>
            <span>· built on real U.S. government data</span>
            <span>· every score is explained, not guessed</span>
          </p>

          {/* The proof, above the fold: the model was tested against a real
              decade, and the test is honest about what it got wrong. */}
          <Link
            href="/methodology#backtest"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-600/20 bg-blue-600/[.04] p-3 transition hover:border-blue-600/40 hover:bg-blue-600/[.07]"
          >
            <span aria-hidden className="text-base leading-snug">📜</span>
            <span className="text-xs leading-relaxed text-foreground/75">
              <strong className="font-semibold text-foreground">Tested against a real decade, not vibes.</strong>{" "}
              We scored 2014&rsquo;s careers with 2014 data, then checked what actually happened by
              2024: rank correlation ρ&nbsp;=&nbsp;{METRICS.spearmanScoreVsRealized}, and{" "}
              {METRICS.declinerHitRatePct}% of the careers that really declined were flagged
              (33% by chance). Where it missed, we say so.{" "}
              <span className="font-medium text-blue-600">See the back-test →</span>
            </span>
          </Link>

          <PageExplainer>
            <p>
              CareerStar rates careers the way analysts rate stocks: every U.S. occupation gets a
              0&ndash;100 score for how strong a bet it is — projected growth and pay, discounted
              by how exposed its work is to AI, blended with how well it fits you.
            </p>
            <p>
              <strong>How to use it:</strong>{" "}search for the careers (or whole fields) you&rsquo;re
              weighing, optionally add your interests, and hit <em>Rate my paths</em>. You&rsquo;ll
              get a ranked comparison with the reasoning shown — not just a number. Not sure where
              to start? Tap one of the examples under the search box.
            </p>
          </PageExplainer>
        </header>

        <CareerForm />
      </div>
    </main>
  );
}
