"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/scorer/types";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";

const DOT: Record<Tone, string> = {
  strong: "fill-emerald-500",
  mixed: "fill-amber-500",
  risky: "fill-red-500",
};
const LEGEND_DOT: Record<Tone, string> = {
  strong: "#10b981",
  mixed: "#f59e0b",
  risky: "#ef4444",
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
  onSelect,
}: {
  results: ScoreResult[];
  onExpand?: () => void;
  onSelect?: (code: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const ticks = [0, 25, 50, 75, 100];
  const hovered = results.find((r) => r.code === hover);

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
        Return vs. risk — up and to the left is the sweet spot (high return, low risk). Hover a
        point for detail; click to jump to its card.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter plot of return versus risk for your careers">
        {/* sweet-spot quadrant: low risk (left) + high return (top) */}
        <rect x={x(0)} y={y(100)} width={x(50) - x(0)} height={y(50) - y(100)} className="fill-emerald-500/[.06]" />
        <text x={x(0) + 6} y={y(100) + 14} className="fill-emerald-600/70" fontSize="9" fontWeight="600">sweet spot</text>

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

        {/* points — numbered to avoid label collisions; size encodes score */}
        {results.map((r, i) => {
          const tone = scoreBand(r.score).tone;
          const cx = x(r.components.risk);
          const cy = y(r.components.return);
          const rad = 7 + (r.score / 100) * 6;
          const active = hover === r.code;
          const dim = hover !== null && !active;
          return (
            <g
              key={r.code}
              className="cursor-pointer"
              opacity={dim ? 0.3 : 1}
              onMouseEnter={() => setHover(r.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(r.code)}
            >
              <circle cx={cx} cy={cy} r={active ? rad + 2 : rad} className={DOT[tone]} stroke="white" strokeWidth={active ? 2 : 1} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="white">
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* tooltip for the hovered point */}
        {hovered && (() => {
          const cx = x(hovered.components.risk);
          const cy = y(hovered.components.return);
          const bw = 150;
          const bh = 46;
          const tx = Math.min(W - bw - 4, Math.max(4, cx + (cx > W / 2 ? -bw - 12 : 12)));
          const ty = Math.min(H - bh - 4, Math.max(4, cy - bh / 2));
          return (
            <g pointerEvents="none">
              <rect x={tx} y={ty} width={bw} height={bh} rx="6" className="fill-background stroke-foreground/20" strokeWidth="1" />
              <text x={tx + 8} y={ty + 16} fontSize="10.5" fontWeight="700" className="fill-foreground">
                {hovered.path.length > 24 ? hovered.path.slice(0, 23) + "…" : hovered.path}
              </text>
              <text x={tx + 8} y={ty + 31} fontSize="10" className="fill-foreground/70">
                Return {hovered.components.return} · Risk {hovered.components.risk}
              </text>
              <text x={tx + 8} y={ty + 42} fontSize="10" className="fill-foreground/70">
                Score {hovered.score}/100
              </text>
            </g>
          );
        })()}
      </svg>

      {/* legend maps the numbers to careers */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {results.map((r, i) => {
          const tone = scoreBand(r.score).tone;
          return (
            <button
              key={r.code}
              type="button"
              onMouseEnter={() => setHover(r.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(r.code)}
              className={`inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs transition ${
                hover === r.code ? "bg-foreground/10 text-foreground" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: LEGEND_DOT[tone] }}
              >
                {i + 1}
              </span>
              {r.path.length > 22 ? r.path.slice(0, 21) + "…" : r.path}
            </button>
          );
        })}
      </div>
    </figure>
  );
}
