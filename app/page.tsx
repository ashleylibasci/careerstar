import CareerForm from "./components/CareerForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-4xl">
        <header className="mb-10 mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Rate the career paths you&rsquo;re weighing — like stocks.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            A data-grounded, risk-adjusted{" "}
            <span className="font-semibold text-foreground">0&ndash;100 viability score</span>{" "}
            for each path in an AI-shaped economy. Tell it what you&rsquo;re interested in
            and what you&rsquo;re considering.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-foreground/60">
            <span>★ 730 careers rated</span>
            <span>· built on real U.S. government data</span>
            <span>· every score is explained, not guessed</span>
          </p>
        </header>

        <CareerForm />
      </div>
    </main>
  );
}
