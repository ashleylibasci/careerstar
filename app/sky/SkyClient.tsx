"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TILTED_STAR_PATH } from "@/app/components/Brand";

// The career sky, drawn on canvas: 730 stars positioned by UMAP over the same
// z-scored 68-d capability space the fit score uses. Deliberately single-theme
// (a night sky is a night sky in light mode too). Brightness/size = rating;
// cobalt halo = wide moat. Hover = tooltip, click = the career's report page.

export interface SkyStar {
  code: string;
  title: string;
  x: number; // 0..1
  y: number; // 0..1
  score: number;
  stars: number;
  moat: string | null;
  group: string;
  field: string;
}
export interface Constellation {
  group: string;
  name: string;
  x: number;
  y: number;
  n: number;
}

// Same picker vocabulary as the home page's interest chips (kept in sync by
// hand; the lexicon in lib/scorer/skills.ts is the single source of meaning).
const INTERESTS: { label: string; value: string }[] = [
  { label: "Working with people", value: "people" },
  { label: "Helping others", value: "helping" },
  { label: "Math", value: "math" },
  { label: "Science", value: "science" },
  { label: "Technology", value: "technology" },
  { label: "Building / hands-on", value: "hands-on" },
  { label: "Design", value: "design" },
  { label: "Creativity", value: "creative" },
  { label: "Writing", value: "writing" },
  { label: "Leadership", value: "leadership" },
  { label: "Business", value: "business" },
  { label: "Finance / money", value: "finance" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Teaching", value: "teaching" },
  { label: "Research", value: "research" },
  { label: "Trades", value: "trades" },
];

const MARGIN = 34; // px kept clear around the plot inside the canvas

interface Placement {
  x: number;
  y: number;
  anchors: { code: string; title: string; sim: number }[];
}

export default function SkyClient({
  stars,
  constellations,
}: {
  stars: SkyStar[];
  constellations: Constellation[];
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<SkyStar | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 960, h: 600 });
  const [interests, setInterests] = useState<string[]>([]);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const pulseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Track container width; the sky keeps a wide aspect (taller on phones) and
  // must never overflow. Measured on mount, on element resize, AND on window
  // resize — belt and suspenders, because a stale width breaks hover mapping.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setSize({ w, h: Math.max(360, Math.round(w * (w < 640 ? 0.95 : 0.62))) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const toPx = useCallback(
    (s: { x: number; y: number }) => ({
      x: MARGIN + s.x * (size.w - 2 * MARGIN),
      y: MARGIN + s.y * (size.h - 2 * MARGIN),
    }),
    [size],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Night ground: deep navy with a faint cobalt bloom in the middle.
    ctx.fillStyle = "#070d24";
    ctx.fillRect(0, 0, size.w, size.h);
    const bloom = ctx.createRadialGradient(size.w / 2, size.h / 2, 0, size.w / 2, size.h / 2, size.w / 2);
    bloom.addColorStop(0, "rgba(29,78,216,0.10)");
    bloom.addColorStop(1, "rgba(29,78,216,0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, size.w, size.h);

    // Constellation names first, under the stars.
    ctx.textAlign = "center";
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    for (const c of constellations) {
      const p = toPx(c);
      ctx.fillStyle = "rgba(148,170,220,0.42)";
      ctx.fillText(c.name.toUpperCase(), p.x, p.y);
    }

    for (const s of stars) {
      const p = toPx(s);
      const t = Math.max(0, Math.min(1, (s.score - 20) / 60)); // 20..80 → 0..1
      const r = 1.3 + t * 2.1;
      const isHover = hover?.code === s.code;
      if (s.moat === "wide") {
        // Wide-moat stars burn cobalt with a soft halo.
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
        halo.addColorStop(0, "rgba(96,140,255,0.55)");
        halo.addColorStop(1, "rgba(96,140,255,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isHover ? "#ffffff" : "#9db9ff";
      } else {
        ctx.fillStyle = isHover ? "#ffffff" : `rgba(226,234,255,${0.35 + t * 0.55})`;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHover ? r + 1.6 : r, 0, Math.PI * 2);
      ctx.fill();
    }

    // "You are here": the exponent star, pulsing gently.
    if (placement) {
      const p = toPx(placement);
      const pulse = 1 + 0.12 * Math.sin(pulseRef.current / 22);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 * pulse);
      glow.addColorStop(0, "rgba(219,230,255,0.5)");
      glow.addColorStop(1, "rgba(219,230,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26 * pulse, 0, Math.PI * 2);
      ctx.fill();

      const sz = 22 * pulse;
      ctx.save();
      ctx.translate(p.x - sz / 2, p.y - sz / 2);
      ctx.scale(sz / 24, sz / 25);
      ctx.fillStyle = "#ffffff";
      ctx.fill(new Path2D(TILTED_STAR_PATH));
      ctx.restore();

      ctx.textAlign = "center";
      ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(240,245,255,0.92)";
      ctx.fillText("you are here", p.x, p.y + 30 * pulse);
    }
  }, [stars, constellations, hover, placement, size, toPx]);

  // Static redraws; a light animation loop only while the marker is up
  // (and only for users who allow motion).
  useEffect(() => {
    if (!placement || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw();
      return;
    }
    const tick = () => {
      pulseRef.current += 1;
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, placement]);

  const nearest = useCallback(
    (mx: number, my: number): SkyStar | null => {
      let best: SkyStar | null = null;
      let bestD = 13 * 13;
      for (const s of stars) {
        const p = toPx(s);
        const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      return best;
    },
    [stars, toPx],
  );

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMouse({ x: mx, y: my });
    setHover(nearest(mx, my));
  }

  async function locate(next: string[]) {
    setInterests(next);
    setPlaceError(null);
    if (next.length === 0) {
      setPlacement(null);
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch("/api/sky-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: next }),
      });
      const d = (await res.json()) as { placed?: boolean; x?: number; y?: number; anchors?: Placement["anchors"]; error?: string };
      if (!res.ok) {
        setPlaceError(d?.error ?? "Couldn't place you just now — try again.");
        setPlacement(null);
      } else if (d.placed && d.x != null && d.y != null) {
        setPlacement({ x: d.x, y: d.y, anchors: d.anchors ?? [] });
      } else {
        setPlacement(null);
      }
    } catch {
      setPlaceError("Couldn't place you just now — try again.");
      setPlacement(null);
    } finally {
      setPlacing(false);
    }
  }

  const chip = "rounded-full px-3 py-1 text-xs font-medium transition";
  const hoverField = useMemo(() => hover?.field, [hover]);

  return (
    <div>
      {/* Locate yourself */}
      <div className="mb-4">
        <div className="text-sm font-semibold">Find yourself in the sky</div>
        <p className="mb-2 mt-0.5 text-xs text-foreground/60">
          Pick interests and a marker appears at the center of the careers whose skill profiles
          best match yours{placing ? " — placing…" : ""}.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map((it) => {
            const on = interests.includes(it.value);
            return (
              <button
                key={it.value}
                type="button"
                aria-pressed={on}
                onClick={() => locate(on ? interests.filter((v) => v !== it.value) : [...interests, it.value])}
                className={`${chip} ${
                  on
                    ? "bg-blue-600 text-white"
                    : "border border-foreground/15 text-foreground/65 hover:border-blue-500/50 hover:text-foreground"
                }`}
              >
                {it.label}
              </button>
            );
          })}
        </div>
        {placeError && (
          <p aria-live="polite" className="mt-2 text-xs text-red-600">{placeError}</p>
        )}
        {placement && placement.anchors.length > 0 && (
          <p className="mt-2 text-xs text-foreground/65">
            Placed between{" "}
            {placement.anchors.map((a, i) => (
              <span key={a.code}>
                {i > 0 && (i === placement.anchors.length - 1 ? " and " : ", ")}
                <a href={`/career/${a.code}`} className="font-medium text-blue-600 hover:underline">
                  {a.title}
                </a>
              </span>
            ))}
            .
          </p>
        )}
      </div>

      <div ref={wrapRef} className="relative">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: size.h }}
          className={`block w-full rounded-2xl border border-foreground/10 ${hover ? "cursor-pointer" : ""}`}
          onMouseMove={onMove}
          onMouseLeave={() => {
            setHover(null);
            setMouse(null);
          }}
          onClick={() => hover && router.push(`/career/${hover.code}`)}
          role="img"
          aria-label={`The career sky: ${stars.length} careers positioned by skill-profile similarity. Use the list of fields below to browse the same data as text.`}
        />
        {hover && mouse && (
          <div
            className="pointer-events-none absolute z-10 max-w-[240px] rounded-xl border border-white/15 bg-[#0b1330]/95 px-3 py-2 text-white shadow-lg"
            style={{
              left: Math.min(mouse.x + 14, size.w - 250),
              top: Math.max(8, mouse.y - 14),
            }}
          >
            <div className="text-[13px] font-semibold leading-tight">{hover.title}</div>
            <div className="mt-0.5 text-[11px] text-white/70">
              {"★".repeat(Math.round(hover.stars))} {hover.score}/100
              {hover.moat === "wide" ? " · 🏰 wide moat" : hover.moat === "narrow" ? " · 🛡 narrow moat" : ""}
            </div>
            <div className="text-[11px] text-white/55">{hoverField} · click for the full report</div>
          </div>
        )}
      </div>
    </div>
  );
}
