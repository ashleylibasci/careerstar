import type { ScoreResult } from "@/lib/scorer/types";

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground/60">{label}</span>
        <span className="font-medium tabular-nums text-foreground/80">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreCard({ result }: { result: ScoreResult }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold leading-snug">{result.path}</h3>
        <div className="shrink-0 text-right">
          <div className="text-3xl font-bold tabular-nums text-blue-600">
            {result.score}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-foreground/50">
            / 100
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ComponentBar label="Return" value={result.components.return} />
        <ComponentBar label="Risk" value={result.components.risk} />
        <ComponentBar label="Fit" value={result.components.fit} />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-foreground/60">{result.note}</p>

      {result.redirect && (
        <div className="mt-3 rounded-xl border border-blue-500/25 bg-blue-500/5 p-3 text-sm">
          <span className="font-semibold">Consider instead: {result.redirect.title}</span>{" "}
          <span className="tabular-nums text-blue-600">({result.redirect.score}/100)</span>
          <span className="text-foreground/60"> — {result.redirect.reason}</span>
        </div>
      )}
    </div>
  );
}
