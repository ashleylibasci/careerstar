import type { ScoreResult } from "@/lib/scorer/types";
import { MODELS, modelConsensus } from "@/lib/scorer/models";

// Model risk, made visible: the same careers scored under five rival rating
// philosophies. Each model's top pick is highlighted; when the models crown
// different winners, that disagreement is surfaced as the finding — not hidden
// behind a single confident number.

export default function ModelComparison({ results }: { results: ScoreResult[] }) {
  const rows = results.filter((r) => r.models);
  if (rows.length < 2) return null;

  // Each model's #1 pick (by that model's score).
  const topByModel: Record<string, string> = {};
  for (const m of MODELS) {
    let best: ScoreResult | null = null;
    for (const r of rows) if (!best || (r.models![m.id] ?? 0) > (best.models![m.id] ?? 0)) best = r;
    if (best) topByModel[m.id] = best.code;
  }
  const distinctWinners = new Set(Object.values(topByModel)).size;

  return (
    <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4 print:hidden">
      <div className="text-sm font-semibold">Five models, one question</div>
      <p className="mb-3 mt-0.5 text-xs text-foreground/60">
        The Standard score is one philosophy. Here are the same careers under four rivals — from
        &ldquo;ignore AI risk entirely&rdquo; to &ldquo;moat is everything.&rdquo; Hover a column
        for each model&rsquo;s worldview; each model&rsquo;s top pick is highlighted.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-foreground/60">
              <th scope="col" className="py-1.5 pr-3 font-medium">Career</th>
              {MODELS.map((m) => (
                <th
                  key={m.id}
                  scope="col"
                  title={`${m.tagline}\n\n${m.formula}`}
                  className="cursor-help whitespace-nowrap py-1.5 px-2 text-right font-medium underline decoration-dotted decoration-foreground/25 underline-offset-2"
                >
                  {m.name}
                </th>
              ))}
              <th scope="col" className="py-1.5 pl-2 text-right font-medium" title="Mean across all five models ± the spread between the highest and lowest.">
                Consensus
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = modelConsensus(r.models!);
              return (
                <tr key={r.code} className="border-b border-foreground/5">
                  <td className="max-w-[180px] truncate py-1.5 pr-3 font-medium">{r.path}</td>
                  {MODELS.map((m) => {
                    const top = topByModel[m.id] === r.code;
                    return (
                      <td
                        key={m.id}
                        className={`py-1.5 px-2 text-right tabular-nums ${
                          top ? "font-bold text-blue-600" : "text-foreground/70"
                        }`}
                      >
                        {r.models![m.id]}
                        {top && <span aria-label={`${m.name}'s top pick`}> ◂</span>}
                      </td>
                    );
                  })}
                  <td className="py-1.5 pl-2 text-right tabular-nums text-foreground/70">
                    {c.mean} <span className="text-foreground/45">±{Math.round(c.spread / 2)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-foreground/60">
        {distinctWinners === 1 ? (
          <>
            <strong className="text-emerald-600">All five models agree on the top pick</strong> —
            the ranking isn&rsquo;t an artifact of one formula.
          </>
        ) : (
          <>
            <strong className="text-amber-600">
              {distinctWinners} different winners across the five models
            </strong>{" "}
            — the answer depends on how much AI risk should count. That disagreement is the honest
            finding, not a bug. The cards above use the Standard model.
          </>
        )}
      </p>
    </div>
  );
}
