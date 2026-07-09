import type { SensitivityReport } from "@/lib/scorer/sensitivity";

// Makes the sensitivity analysis visible: for the compared careers, show the
// score BAND each one spans across 729 weightings (±20% on every weight) and how
// often it held its rank. A tight band that holds rank = robust; a wide band that
// shuffles = the model is honestly telling you those careers are close.

function Band({ min, max, baseline }: { min: number; max: number; baseline: number }) {
  const left = Math.max(0, Math.min(100, min));
  const width = Math.max(1.5, Math.min(100, max) - left);
  const dot = Math.max(0, Math.min(100, baseline));
  return (
    <div className="relative h-2.5 w-full rounded-full bg-foreground/10" aria-hidden>
      <div
        className="absolute h-2.5 rounded-full bg-blue-500/30"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-blue-600"
        style={{ left: `calc(${dot}% - 2px)` }}
      />
    </div>
  );
}

export default function RobustnessPanel({ sensitivity }: { sensitivity: SensitivityReport }) {
  if (sensitivity.candidates.length < 2) return null;
  const robust = sensitivity.headline.startsWith("Robust");

  return (
    <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-semibold">Robustness check</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            robust ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
          }`}
        >
          {robust ? "Robust" : "Close call"}
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-foreground/60">
        {sensitivity.headline} Each bar is the score range across{" "}
        <strong>{sensitivity.trials.toLocaleString()}</strong> weightings that each move every weight
        by ±{sensitivity.jitterPct}%; the mark is the current score.
      </p>

      <div className="space-y-3">
        {sensitivity.candidates.map((c) => (
          <div key={c.code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
            <div className="col-span-2 flex items-baseline justify-between gap-2 sm:col-span-1 sm:justify-start">
              <span className="truncate text-sm font-medium">{c.path}</span>
              <span className="text-xs text-foreground/60">
                {c.rankBest === c.rankWorst
                  ? `held #${c.rankBest} · 100%`
                  : `#${c.rankBest}–${c.rankWorst} · #${c.baselineRank} in ${Math.round(c.heldRankPct * 100)}%`}
              </span>
            </div>
            <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
              <Band min={c.scoreMin} max={c.scoreMax} baseline={c.baselineScore} />
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-foreground/60">
                {c.scoreMin}–{c.scoreMax}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
