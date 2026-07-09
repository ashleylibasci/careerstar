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

export default function CompareRadar({ results }: { results: ScoreResult[] }) {
  const series = results.slice(0, 6);
  const rings = [25, 50, 75, 100];

  return (
    <figure className="rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
      <figcaption className="mb-3 text-sm font-semibold">Compare across every axis</figcaption>
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
        {series.map((r, si) => (
          <polygon
            key={r.code}
            points={AXES.map((ax, i) => point(i, ax.get(r)).join(",")).join(" ")}
            fill={COLORS[si % COLORS.length]}
            fillOpacity="0.12"
            stroke={COLORS[si % COLORS.length]}
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((r, si) => (
          <span key={r.code} className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[si % COLORS.length] }} />
            {r.path.length > 24 ? r.path.slice(0, 23) + "…" : r.path}
          </span>
        ))}
      </div>
    </figure>
  );
}
