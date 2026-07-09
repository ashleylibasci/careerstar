"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/scorer/types";

const COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const AXES: { label: string; get: (r: ScoreResult) => number }[] = [
  { label: "Return", get: (r) => r.components.return },
  { label: "Resilience", get: (r) => r.breakdown?.resilience ?? 100 - r.components.risk },
  { label: "Fit", get: (r) => r.components.fit },
  { label: "Growth", get: (r) => r.breakdown?.growthRank ?? 50 },
  { label: "Pay", get: (r) => r.breakdown?.payRank ?? 50 },
];

const CX = 180;
const CY = 150;
const R = 108;
const N = AXES.length;

function point(axis: number, value: number): [number, number] {
  const angle = (-90 + (360 / N) * axis) * (Math.PI / 180);
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

export default function CompareRadar({
  results,
  onExpand,
  onSelect,
}: {
  results: ScoreResult[];
  onExpand?: () => void;
  onSelect?: (code: string) => void;
}) {
  const series = results.slice(0, 6);
  const codesKey = series.map((r) => r.code).join(",");
  // Default to the top 3 so the chart starts legible, not a six-polygon pile.
  const [visible, setVisible] = useState<Set<string>>(() => new Set(series.slice(0, 3).map((r) => r.code)));
  const [hover, setHover] = useState<string | null>(null);

  // When the compared set changes, reset selection during render (no effect needed).
  const [prevKey, setPrevKey] = useState(codesKey);
  if (codesKey !== prevKey) {
    setPrevKey(codesKey);
    setVisible(new Set(series.slice(0, 3).map((r) => r.code)));
    setHover(null);
  }

  const rings = [25, 50, 75, 100];
  const colorOf = (i: number) => COLORS[i % COLORS.length];
  const toggle = (code: string) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <figure className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <figcaption className="text-sm font-semibold">Compare across every axis</figcaption>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Expand radar chart"
            className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 text-xs text-foreground/60 transition hover:border-blue-500/50 hover:text-foreground print:hidden"
          >
            ⤢ Expand
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-foreground/60">
        Toggle a career below to add or remove it; hover to spotlight; click its line to open its card.
      </p>
      <svg viewBox="0 0 360 300" className="w-full" role="img" aria-label="Radar chart comparing careers across five axes">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={AXES.map((_, i) => point(i, ring).join(",")).join(" ")}
            className="fill-none stroke-foreground/10"
            strokeWidth="1"
          />
        ))}
        {AXES.map((ax, i) => {
          const [lx, ly] = point(i, 122);
          return (
            <g key={ax.label}>
              <line x1={CX} y1={CY} x2={point(i, 100)[0]} y2={point(i, 100)[1]} className="stroke-foreground/10" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-foreground/60" fontSize="11">{ax.label}</text>
            </g>
          );
        })}
        {series.map((r, si) => {
          if (!visible.has(r.code)) return null;
          const active = hover === r.code;
          const dim = hover !== null && !active;
          return (
            <polygon
              key={r.code}
              points={AXES.map((ax, i) => point(i, ax.get(r)).join(",")).join(" ")}
              fill={colorOf(si)}
              fillOpacity={active ? 0.28 : dim ? 0.04 : 0.12}
              stroke={colorOf(si)}
              strokeWidth={active ? 2.5 : 1.5}
              strokeOpacity={dim ? 0.35 : 1}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHover(r.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(r.code)}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {series.map((r, si) => {
          const on = visible.has(r.code);
          return (
            <button
              key={r.code}
              type="button"
              aria-pressed={on}
              onMouseEnter={() => on && setHover(r.code)}
              onMouseLeave={() => setHover(null)}
              onClick={() => toggle(r.code)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition ${
                on ? "border-foreground/15 text-foreground/80" : "border-transparent text-foreground/35 line-through"
              } ${hover === r.code ? "bg-foreground/10" : ""}`}
              title={on ? "Click to hide" : "Click to show"}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: on ? colorOf(si) : "transparent", border: on ? "none" : `1.5px solid ${colorOf(si)}` }} />
              {r.path.length > 22 ? r.path.slice(0, 21) + "…" : r.path}
            </button>
          );
        })}
      </div>
    </figure>
  );
}
