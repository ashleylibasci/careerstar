import Link from "next/link";
import type { ScoreResult } from "@/lib/scorer/types";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";

const TONE: Record<Tone, { text: string; pill: string; bar: string; star: string }> = {
  strong: { text: "text-emerald-600", pill: "bg-emerald-500/12 text-emerald-700", bar: "bg-emerald-500", star: "fill-emerald-500" },
  mixed: { text: "text-amber-600", pill: "bg-amber-500/12 text-amber-700", bar: "bg-amber-500", star: "fill-amber-500" },
  risky: { text: "text-red-600", pill: "bg-red-500/12 text-red-600", bar: "bg-red-500", star: "fill-red-500" },
};

const STAR_PATH = "M10 1l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77 4.79 17.5l.99-5.8-4.21-4.1 5.82-.85z";

/** 5 stars with half-star precision, tinted by band tone. `id` keeps clip paths unique per card. */
function Stars({ value, colorClass, id }: { value: number; colorClass: string; id: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const frac = Math.max(0, Math.min(1, value - (i - 1)));
        const clipId = `star-${id}-${i}`;
        return (
          <svg key={i} viewBox="0 0 20 20" className="h-4 w-4">
            {frac > 0 && frac < 1 && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={20 * frac} height="20" />
                </clipPath>
              </defs>
            )}
            <path d={STAR_PATH} className="fill-foreground/15" />
            {frac >= 1 && <path d={STAR_PATH} className={colorClass} />}
            {frac > 0 && frac < 1 && <path d={STAR_PATH} className={colorClass} clipPath={`url(#${clipId})`} />}
          </svg>
        );
      })}
    </div>
  );
}

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

export default function ScoreCard({
  result,
  top = false,
  highlighted = false,
}: {
  result: ScoreResult;
  top?: boolean;
  highlighted?: boolean;
}) {
  const band = scoreBand(result.score);
  const tone = TONE[band.tone];
  // Resilience = the inverse of risk, so every bar means "higher is better."
  const resilience = 100 - result.components.risk;

  return (
    <div
      id={`card-${result.code}`}
      className={`scroll-mt-24 rounded-2xl border bg-foreground/[.02] p-5 shadow-sm transition-all duration-300 ${
        highlighted ? "border-blue-500 ring-2 ring-blue-500/40" : "border-foreground/10"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {top && (
            <span className="mb-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              ★ Best bet
            </span>
          )}
          <h3 className="text-base font-semibold leading-snug">{result.path}</h3>
          {result.stars != null && (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars value={result.stars} colorClass={tone.star} id={result.code} />
              <span className={`text-xs font-semibold ${tone.text}`}>{band.label}</span>
              {result.percentile != null && result.percentile >= 50 && (
                <span className="text-xs text-foreground/45">· top {Math.max(1, 100 - result.percentile)}% of careers</span>
              )}
            </div>
          )}
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
          <div className="text-[10px] font-medium uppercase tracking-wide text-foreground/40">/ 100</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Bar label="Return" value={result.components.return} colorClass="bg-blue-500" />
        <Bar label="Resilience" value={resilience} colorClass="bg-blue-500" />
        <Bar label="Fit" value={result.components.fit} colorClass="bg-blue-500" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-foreground/70">{result.note}</p>

      {(result.bulls?.length || result.bears?.length) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.bulls?.length ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[.05] p-3">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                🐂 Bulls say
              </div>
              <ul className="space-y-1.5 text-xs leading-snug text-foreground/75">
                {result.bulls.map((b, i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-emerald-600">+</span>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.bears?.length ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[.05] p-3">
              <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                🐻 Bears say
              </div>
              <ul className="space-y-1.5 text-xs leading-snug text-foreground/75">
                {result.bears.map((b, i) => (
                  <li key={i} className="flex gap-1.5"><span className="text-red-500">−</span>{b}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

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

      <div className="mt-3">
        <Link href={`/career/${result.code}`} className="text-xs text-blue-600 hover:underline">
          View full details →
        </Link>
      </div>
    </div>
  );
}
