import type { Metadata } from "next";
import Link from "next/link";
import ExploreClient from "./ExploreClient";
import PageExplainer from "@/app/components/PageExplainer";

export const metadata: Metadata = {
  title: "Explore careers — CareerStar",
  description:
    "Browse, filter, and rank 730 occupations by viability, AI-resilience, growth, or pay.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ moat?: string; q?: string }>;
}) {
  const { moat, q } = await searchParams;
  const initialMoat = moat && ["wide", "narrow", "none"].includes(moat) ? moat : "all";
  const initialSearch = (q ?? "").slice(0, 80);
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight">Explore all careers</h1>
        <p className="mt-2 text-foreground/70">
          730 occupations from the U.S. government&rsquo;s employment projections — every one
          with complete data — ranked by a baseline viability score (before your interests are
          factored in). Filter, sort, and click any career for its full report.
        </p>

        <PageExplainer>
          <p>
            This is the whole rated market: 730 occupations from the U.S. government&rsquo;s
            employment projections (every one with complete growth, pay, and AI-exposure data),
            each with a neutral baseline rating — the same score everyone sees, before any
            personal interests are factored in.
          </p>
          <p>
            <strong>How to use it:</strong>{" "}sort by score, growth, or pay; filter by
            &ldquo;moat&rdquo; (how shielded a career is from AI); and click any row for the full
            report. If you want scores tailored to <em>you</em>, take your shortlist to the{" "}
            <Link href="/" className="font-medium text-blue-600 hover:underline">home page</Link>{" "}and
            rate it there.
          </p>
        </PageExplainer>
        <div className="mt-8">
          <ExploreClient initialMoat={initialMoat} initialSearch={initialSearch} />
        </div>
      </div>
    </main>
  );
}
