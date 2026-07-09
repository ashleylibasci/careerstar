import CareerForm from "./components/CareerForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Rate the career paths you&rsquo;re weighing — like stocks.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/70">
            A data-grounded, risk-adjusted{" "}
            <span className="font-semibold text-foreground">0&ndash;100 viability score</span>{" "}
            for each path in an AI-shaped economy. Tell it what you&rsquo;re interested in
            and what you&rsquo;re considering.
          </p>
        </header>

        <CareerForm />
      </div>
    </main>
  );
}
