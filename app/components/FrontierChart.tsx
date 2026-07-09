import type { ScoreResult } from "@/lib/scorer/types";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";

const DOT: Record<Tone, string> = {
  strong: "fill-emerald-500",
  mixed: "fill-amber-500",
  risky: "fill-red-500",
};

const PAD = { l: 44, r: 16, t: 16, b: 40 };
const W = 480;
const H = 320;
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

const x = (risk: number) => PAD.l + (risk / 100) * plotW;
const y = (ret: number) => PAD.t + (1 - ret / 100) * plotH;

export default function FrontierChart({
  results,
  onExpand,
}: {
  results: ScoreResult[];
  onExpand?: () => void;
}) {
  const ticks = [0, 25, 50, 75, 100];

  return (
    <figure className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <figcaption className="text-sm font-semibold">Your careers as assets</figcaption>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand scatter plot"
            className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 text-xs text-foreground/60 transition hover:border-blue-500/50 hover:text-foreground print:hidden"
          >
            ⤢ Expand
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-foreground/60">
        Return vs. risk — up and to the left is the sweet spot (high return, low risk).
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter plot of return versus risk for your careers">
        {/* grid */}
        {ticks.map((t) => (
          <g key={`gx${t}`}>
            <line x1={x(t)} y1={PAD.t} x2={x(t)} y2={PAD.t + plotH} className="stroke-foreground/10" strokeWidth="1" />
            <text x={x(t)} y={H - PAD.b + 16} textAnchor="middle" className="fill-foreground/40" fontSize="10">{t}</text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={`gy${t}`}>
            <line x1={PAD.l} y1={y(t)} x2={PAD.l + plotW} y2={y(t)} className="stroke-foreground/10" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t) + 3} textAnchor="end" className="fill-foreground/40" fontSize="10">{t}</text>
          </g>
        ))}

        {/* axis labels */}
        <text x={PAD.l + plotW / 2} y={H - 4} textAnchor="middle" className="fill-foreground/60" fontSize="11">Risk →</text>
        <text x={12} y={PAD.t + plotH / 2} textAnchor="middle" fontSize="11" className="fill-foreground/60" transform={`rotate(-90 12 ${PAD.t + plotH / 2})`}>Return →</text>

        {/* points */}
        {results.map((r) => {
          const tone = scoreBand(r.score).tone;
          return (
            <g key={r.code}>
              <circle cx={x(r.components.risk)} cy={y(r.components.return)} r="6" className={DOT[tone]} />
              <text x={x(r.components.risk) + 9} y={y(r.components.return) + 3} className="fill-foreground/70" fontSize="10">
                {r.path.length > 20 ? r.path.slice(0, 19) + "…" : r.path}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
