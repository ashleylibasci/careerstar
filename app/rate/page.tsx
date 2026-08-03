import type { Metadata } from "next";
import Link from "next/link";
import CareerForm from "@/app/components/CareerForm";
import PageExplainer from "@/app/components/PageExplainer";

export const metadata: Metadata = {
  title: "Rate your career paths — CareerStar",
  description:
    "Compare the career paths you're weighing: one 0–100 risk-adjusted score each — growth and pay weighed against AI risk, tailored to your interests.",
  alternates: { canonical: "/rate" },
};

export default function RatePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-2xl">
        {/* Lean on purpose: the landing did the explaining — here, the search
            box belongs in the first viewport. */}
        <header className="mx-auto mb-6 max-w-2xl print:hidden">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Rate the paths you&rsquo;re weighing.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            One 0&ndash;100 score per path — growth and pay weighed against AI risk. No idea yet?
            Start from your interests instead.
          </p>

          <PageExplainer>
            <p>
              Every score is computed by an explicit, deterministic model — projected growth and
              pay, discounted by how exposed the work is to AI, blended with how well it fits
              you. Never guessed by an AI.
            </p>
            <p>
              <strong>How to use it:</strong>{" "}search for the careers (or whole fields)
              you&rsquo;re weighing, optionally add your interests, and hit{" "}
              <em>Rate my paths</em>. You&rsquo;ll get a ranked comparison with the reasoning
              shown — not just a number. Not sure where to start? Tap one of the examples under
              the search box, and read{" "}
              <Link href="/" className="font-medium text-blue-600 hover:underline">
                how CareerStar works
              </Link>{" "}
              for the full idea.
            </p>
          </PageExplainer>
        </header>

        <CareerForm />
      </div>
    </main>
  );
}
