"use client";

import { useEffect, useState } from "react";
import type { Tone } from "@/lib/scorer/verdict";

// The score as an instrument: a ring gauge filled to score/100, mono numerals
// inside. The arc sweeps up from zero on mount — an instrument warms up, it
// doesn't just appear (motion-safe; reduced-motion and print see the full arc
// immediately). Shared by the score cards and the career-report hero.

const DIAL: Record<Tone, { text: string; stroke: string }> = {
  strong: { text: "text-emerald-600", stroke: "stroke-emerald-500" },
  mixed: { text: "text-amber-600", stroke: "stroke-amber-500" },
  risky: { text: "text-red-600", stroke: "stroke-red-500" },
};

export default function ScoreDial({
  score,
  tone,
  size = 64,
}: {
  score: number;
  tone: Tone;
  size?: number;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * c;
  const [swept, setSwept] = useState(false);
  useEffect(() => {
    // One frame at zero, then sweep. Reduced-motion users skip the animation
    // via motion-safe on the transition class — the arc simply appears full.
    const raf = requestAnimationFrame(() => setSwept(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const sweep = swept
    ? filled
    : typeof window === "undefined"
      ? filled // SSR/print fallback: full arc, no zero-state flash without JS
      : 0;
  const big = size >= 76;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg viewBox="0 0 60 60" width={size} height={size} className="-rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="3.5" className="stroke-foreground/10" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${sweep} ${c}`}
          className={`${DIAL[tone].stroke} motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`num font-bold leading-none ${big ? "text-2xl" : "text-lg"} ${DIAL[tone].text}`}>
          {score}
        </span>
        <span className={`mt-0.5 font-medium text-foreground/45 ${big ? "text-[10px]" : "text-[8px]"}`}>
          /100
        </span>
      </div>
    </div>
  );
}
