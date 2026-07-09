import type { ScoreResult } from "@/lib/scorer/types";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";

const TONE: Record<Tone, { text: string; pill: string; bar: string }> = {
  strong: { text: "text-emerald-600", pill: "bg-emerald-500/12 text-emerald-700", bar: "bg-emerald-500" },
  mixed: { text: "text-amber-600", pill: "bg-amber-500/12 text-amber-700", bar: "bg-amber-500" },
  risky: { text: "text-red-600", pill: "bg-red-500/12 text-red-600", bar: "bg-red-500" },
};

function Bar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground/60">{label}</span>
        <span className="font-medium tabular-nums text-foreground/80">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreCard({ result, top = false }: { result: ScoreResult; top?: boolean }) {
  const band = scoreBand(result.score);
  const tone = TONE[band.tone];
  // Resilience = the inverse of risk, so every bar means "higher is better."
  const resilience = 100 - result.components.risk;

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          {top && (
            <span className="mb-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              ★ Best bet
            </span>
          )}
          <h3 className="text-base font-semibold leading-snug">{result.path}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-3xl font-bold tabular-nums ${tone.text}`}>
            {result.score}
            {result.confidence != null && (
              <span className="ml-1 align-top text-xs font-medium text-foreground/40">
                ±{result.confidence}
              </span>
            )}
          </div>
          <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.pill}`}>
            {band.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Bar label="Return" value={result.components.return} colorClass="bg-blue-500" />
        <Bar label="Resilience" value={resilience} colorClass="bg-blue-500" />
        <Bar label="Fit" value={result.components.fit} colorClass="bg-blue-500" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground/70">{result.note}</p>

      {result.redirect && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-500/25 bg-blue-500/5 p-3">
          <span className="mt-0.5 text-blue-600">↗</span>
          <div className="text-sm">
            <span className="font-semibold text-foreground/60">You might prefer: </span>
            <span className="font-semibold">{result.redirect.title}</span>{" "}
            <span className="tabular-nums text-blue-600">{result.redirect.score}/100</span>
            <div className="text-foreground/60">{result.redirect.reason}</div>
          </div>
        </div>
      )}

      {result.breakdown && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
            Why this score?
          </summary>
          <div className="mt-3 space-y-2 border-t border-foreground/10 pt-3 text-xs leading-relaxed text-foreground/70">
            <div>
              <span className="font-semibold">Return {result.components.return}</span> —
              growth ranks {result.breakdown.growthRank}/100, pay ranks{" "}
              {result.breakdown.payRank}/100 vs. all careers.
            </div>
            <div>
              <span className="font-semibold">Resilience {resilience}</span> — AI exposure is{" "}
              {result.breakdown.aiExposurePct}/100 (share of tasks, not job loss).
            </div>
            <div>
              <span className="font-semibold">Fit {result.components.fit}</span> — overlap with
              the interests you gave.
            </div>
            <div className="text-foreground/50">
              Raw: {result.breakdown.growthPct >= 0 ? "+" : ""}
              {result.breakdown.growthPct}% projected growth ·{" "}
              ${result.breakdown.medianPay.toLocaleString()} median pay.
            </div>
            <div className="rounded-lg bg-foreground/[.04] p-2 font-mono text-[11px] text-foreground/60">
              score = 100 · [ α·(return × (1 − γ·risk)) + (1 − α)·fit ]
              <br />
              α = {result.breakdown.alpha}, γ = {result.breakdown.gamma.toFixed(2)}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
