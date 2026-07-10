import type { Metadata } from "next";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore careers — CareerStar",
  description:
    "Browse, filter, and rank all ~730 occupations by viability, AI-resilience, growth, or pay.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ moat?: string }>;
}) {
  const { moat } = await searchParams;
  const initialMoat = moat && ["wide", "narrow", "none"].includes(moat) ? moat : "all";
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Explore all careers</h1>
        <p className="mt-2 text-foreground/70">
          Every occupation the BLS tracks, ranked by a neutral viability score. Filter by
          field or pay, sort by what you care about, and click any career to score it.
        </p>
        <div className="mt-8">
          <ExploreClient initialMoat={initialMoat} />
        </div>
      </div>
    </main>
  );
}
