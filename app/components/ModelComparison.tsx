import type { ScoreResult } from "@/lib/scorer/types";
import { MODELS, modelConsensus } from "@/lib/scorer/models";

// Model risk, made visible — and legible. The same careers scored by five
// different "judges," each with a different philosophy about AI risk. The
// verdict (do the judges agree?) leads; the table and a plain-language legend
// follow. No finance background assumed.

const PLAIN: Record<string, string> = {
  standard: "the balanced judge — AI risk discounts the reward (the score used everywhere else)",
  momentum: "the optimist — bets on growth and pay, ignores AI risk on purpose",
  defensive: "the safety-first judge — the career's moat (how shielded it is from AI) matters most, reward is secondary",
  sharpe: "the efficiency judge — how much reward you get per unit of risk",
  equal: "the simple average of everything — a sanity-check the fancy models must beat",
};

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
  const agree = distinctWinners === 1;
  const winnerTitle = agree ? rows.find((r) => r.code === Object.values(topByModel)[0])?.path : null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-500/25 bg-blue-500/[.04] p-4 print:hidden">
      <div className="text-sm font-semibold">🧮 Second opinions — five ways to rate a career</div>
      <p className="mb-3 mt-1 text-sm leading-relaxed text-foreground/70">
        Which career &ldquo;wins&rdquo; depends on how much you think AI risk should count — and no
        single formula can settle that. So the same careers are scored by{" "}
        <strong>five different judges</strong>, from &ldquo;ignore AI entirely&rdquo; to
        &ldquo;safety is everything.&rdquo; If they all agree, the ranking is solid. If they
        don&rsquo;t, that tells you something real.
      </p>

      <div
        className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
          agree
            ? "border-emerald-500/30 bg-emerald-500/[.07] text-foreground/80"
            : "border-amber-500/30 bg-amber-500/[.07] text-foreground/80"
        }`}
      >
        {agree ? (
          <>
            ✅ <strong className="text-emerald-700 dark:text-emerald-400">All five judges pick {winnerTitle} as #1.</strong>{" "}
            The ranking isn&rsquo;t an artifact of one formula — that&rsquo;s about as solid as a
            career comparison gets.
          </>
        ) : (
          <>
            ⚖️ <strong className="text-amber-700 dark:text-amber-500">The judges disagree — {distinctWinners} different careers win depending on the model.</strong>{" "}
            Translation: your answer genuinely depends on how much you believe AI will reshape work.
            That&rsquo;s the honest finding, not a bug. (The cards above use the balanced Standard
            judge.)
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-foreground/60">
              <th scope="col" className="py-1.5 pr-3 font-medium">Career</th>
              {MODELS.map((m) => (
                <th
                  key={m.id}
                  scope="col"
                  title={`${m.tagline}\n\nFormula: ${m.formula}`}
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
      <p className="mt-1.5 text-[11px] text-foreground/55">◂ marks each judge&rsquo;s top pick · Consensus = average across all five ± disagreement</p>

      <div className="mt-3 grid gap-x-6 gap-y-1.5 border-t border-foreground/10 pt-3 sm:grid-cols-2">
        {MODELS.map((m) => (
          <div key={m.id} className="text-xs leading-snug text-foreground/65">
            <span className="font-semibold text-foreground/80">{m.name}</span> — {PLAIN[m.id]}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-foreground/55">
        Exact formulas are on the{" "}
        <a href="/methodology" className="text-blue-600 hover:underline">methodology page</a>.
      </p>
    </div>
  );
}
