import type { ScoreResult } from "./types.ts";

// Presentation layer: how a raw 0–100 score becomes a Morningstar-style card.
// Nothing here changes a score — it only frames one.

// --- Star rating: a forced, RELATIVE curve (the authentic Morningstar move) ---
// Stars are not score/20. They are the career's position in the whole field:
// top 10% → 5★, next 22.5% → 4★, middle 35% → 3★, next 22.5% → 2★, bottom 10% → 1★.
// Computed against every occupation under the user's CURRENT weights, so the
// rating means "top X% of careers, your priorities" — and moves as they retune.
const STAR_BANDS = [
  { min: 90, star: 5 },
  { min: 67.5, star: 4 },
  { min: 32.5, star: 3 },
  { min: 10, star: 2 },
  { min: 0, star: 1 },
];

/** Percentile (0–100, higher = better) → stars in {1, 1.5, … 5}. */
export function starsFromPercentile(pct: number): number {
  const p = Math.max(0, Math.min(100, pct));
  for (let i = 0; i < STAR_BANDS.length; i++) {
    if (p >= STAR_BANDS[i].min) {
      const lo = STAR_BANDS[i].min;
      const hi = i === 0 ? 100 : STAR_BANDS[i - 1].min;
      const t = hi > lo ? (p - lo) / (hi - lo) : 0;
      return Math.min(5, STAR_BANDS[i].star + (t >= 0.5 ? 0.5 : 0));
    }
  }
  return 1;
}

/** Percentile of `score` within the full scored field (share of careers it meets or beats). */
export function percentileOf(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 50;
  let c = 0;
  for (const s of allScores) if (s <= score) c++;
  return (c / allScores.length) * 100;
}

// --- Bulls say / Bears say: deterministic, ranked by how extreme each signal is ---
// Every bullet is picked and phrased from the computed components (the LLM may
// later restyle wording, never the selection). Balance is enforced: even a great
// career shows its softest spot, even a weak one shows its brightest — Morningstar
// always argues both sides.

interface Signal {
  side: "bull" | "bear";
  strength: number; // distance from neutral; bigger = more decisive
  text: string;
}

export interface BullsBears {
  bulls: string[];
  bears: string[];
}

export function bullsAndBears(r: ScoreResult): BullsBears {
  const b = r.breakdown;
  const signals: Signal[] = [];

  if (b) {
    const g = b.growthRank;
    if (g >= 55) signals.push({ side: "bull", strength: g - 50, text: `Strong projected growth — outpaces ${g}% of careers (${b.growthPct >= 0 ? "+" : ""}${b.growthPct}%).` });
    else if (g <= 45) signals.push({ side: "bear", strength: 50 - g, text: b.growthPct < 0 ? `Projected to shrink (${b.growthPct}%).` : `Slow growth — behind ${100 - g}% of careers.` });

    const p = b.payRank;
    if (p >= 55) signals.push({ side: "bull", strength: p - 50, text: `High pay — above ${p}% of careers ($${b.medianPay.toLocaleString()}).` });
    else if (p <= 45) signals.push({ side: "bear", strength: 50 - p, text: `Below-median pay ($${b.medianPay.toLocaleString()}).` });

    const e = b.aiExposurePct;
    if (e <= 45) signals.push({ side: "bull", strength: 50 - e, text: `Low AI exposure — resilient (${e}% of tasks exposed).` });
    else if (e >= 55) signals.push({ side: "bear", strength: e - 50, text: `High AI exposure — ${e}% of tasks are model-touchable (exposure ≠ job loss).` });
  }

  // Fit only counts as a signal when the user actually gave interests (neutral = 50).
  const f = r.components.fit;
  if (f >= 60) signals.push({ side: "bull", strength: f - 50, text: `Strong fit to the interests you gave.` });
  else if (f <= 40) signals.push({ side: "bear", strength: 50 - f, text: `Weak fit to the interests you gave.` });

  let bulls = signals.filter((s) => s.side === "bull").sort((a, b) => b.strength - a.strength);
  let bears = signals.filter((s) => s.side === "bear").sort((a, b) => b.strength - a.strength);

  // Enforce balance: always at least one of each, drawn from the weakest/strongest axis.
  if (b) {
    const axes = [
      { pct: b.growthRank, high: `growth beats ${b.growthRank}% of careers`, low: `growth is middling` },
      { pct: b.payRank, high: `pay tops ${b.payRank}% of careers ($${b.medianPay.toLocaleString()})`, low: `pay is mid-pack ($${b.medianPay.toLocaleString()})` },
      { pct: 100 - b.aiExposurePct, high: `it's relatively AI-resilient`, low: `it carries some AI exposure (${b.aiExposurePct}% of tasks)` },
    ];
    if (bears.length === 0) {
      const weakest = [...axes].sort((a, b) => a.pct - b.pct)[0];
      bears = [{ side: "bear", strength: 0, text: `Its softest spot: ${weakest.low}.` }];
    }
    if (bulls.length === 0) {
      const best = [...axes].sort((a, b) => b.pct - a.pct)[0];
      bulls = [{ side: "bull", strength: 0, text: `Its brightest spot: ${best.high}.` }];
    }
  }

  return { bulls: bulls.slice(0, 3).map((s) => s.text), bears: bears.slice(0, 3).map((s) => s.text) };
}
