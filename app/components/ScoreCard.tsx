"use client";

import { useState } from "react";
import Link from "next/link";
import type { ScoreResult } from "@/lib/scorer/types";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";
import { uncertaintyLabel } from "@/lib/scorer/rating";
import { Stars } from "./rating-ui";
import MoatBadge from "./MoatBadge";
import FeedbackWidget from "./FeedbackWidget";

const BAR_HELP: Record<string, string> = {
  Return: "Growth + pay, percentile-ranked against all 730 careers. Higher is better.",
  Resilience: "The inverse of AI-exposure + volatility risk. Higher = harder to disrupt.",
  Fit: "How well this career's real O*NET skill profile matches your interests.",
};

const TONE: Record<Tone, { text: string; pill: string; bar: string; star: string }> = {
  strong: { text: "text-emerald-600", pill: "bg-emerald-500/12 text-emerald-700", bar: "bg-emerald-500", star: "fill-emerald-500" },
  mixed: { text: "text-amber-600", pill: "bg-amber-500/12 text-amber-700", bar: "bg-amber-500", star: "fill-amber-500" },
  risky: { text: "text-red-600", pill: "bg-red-500/12 text-red-600", bar: "bg-red-500", star: "fill-red-500" },
};

function Bar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div title={BAR_HELP[label]}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="cursor-help text-foreground/60 underline decoration-dotted decoration-foreground/25 underline-offset-2">{label}</span>
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
  defaultOpen = true,
  rank,
}: {
  result: ScoreResult;
  top?: boolean;
  highlighted?: boolean;
  defaultOpen?: boolean;
  rank?: number;
}) {
  const band = scoreBand(result.score);
  const tone = TONE[band.tone];
  // Resilience = the inverse of risk, so every bar means "higher is better."
  const resilience = 100 - result.components.risk;

  const [open, setOpen] = useState(defaultOpen);
  // Jumping to a card from a chart point should reveal it, even if collapsed.
  const [prevHi, setPrevHi] = useState(highlighted);
  if (highlighted !== prevHi) {
    setPrevHi(highlighted);
    if (highlighted) setOpen(true);
  }

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      id={`card-${result.code}`}
      className={`group scroll-mt-24 overflow-hidden rounded-2xl border bg-foreground/[.02] shadow-sm transition-all duration-300 ${
        highlighted ? "border-blue-500 ring-2 ring-blue-500/40" : "border-foreground/10"
      }`}
    >
      {/* Compact header — always visible. Click to expand the full analysis. */}
      <summary className="flex cursor-pointer list-none items-start gap-4 p-5 transition hover:bg-foreground/[.02] [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {top ? (
              <span className="inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                ★ Best bet
              </span>
            ) : rank != null ? (
              <span className="inline-block rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground/60">
                #{rank}
              </span>
            ) : null}
            <h3 className="text-base font-semibold leading-snug">{result.path}</h3>
          </div>
          {result.stars != null && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Stars value={result.stars} colorClass={tone.star} id={result.code} />
              <span className={`text-xs font-semibold ${tone.text}`}>{band.label}</span>
              {result.percentile != null && result.percentile >= 50 && (
                <span className="text-xs text-foreground/60">· top {Math.max(1, 100 - result.percentile)}% of careers</span>
              )}
              {result.moat && <MoatBadge moat={result.moat} />}
            </div>
          )}
          {/* Quick stats so the row is scannable without opening it. */}
          <div className="mt-1.5 text-xs tabular-nums text-foreground/55">
            Return {result.components.return} · Resilience {resilience} · Fit {result.components.fit}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2 text-right">
          <div>
            <div className={`text-3xl font-bold tabular-nums ${tone.text}`}>
              {result.score}
              <span className="align-top text-sm font-medium text-foreground/45">/100</span>
            </div>
            {uncertaintyLabel(result.confidence) && (
              <div
                className="text-[10px] font-medium uppercase tracking-wide text-foreground/55"
                title="How rough the estimate is — higher with high AI exposure or weak fit."
              >
                {uncertaintyLabel(result.confidence)} uncertainty
              </div>
            )}
          </div>
          <span
            aria-hidden
            className="mt-1.5 shrink-0 text-xs text-foreground/40 transition-transform group-open:rotate-180"
            title="Expand for the full analysis"
          >
            ▼
          </span>
        </div>
      </summary>

      {/* Full analysis — revealed on expand. */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 gap-3 border-t border-foreground/10 pt-4 sm:grid-cols-3">
          <Bar label="Return" value={result.components.return} colorClass="bg-blue-500" />
          <Bar label="Resilience" value={resilience} colorClass="bg-blue-500" />
          <Bar label="Fit" value={result.components.fit} colorClass="bg-blue-500" />
        </div>
        {/* Always-visible legend so the bars are clear without hovering (mobile too). */}
        <p className="mt-2 text-[11px] leading-snug text-foreground/50">
          <strong className="font-semibold text-foreground/60">Return</strong> = growth + pay ·{" "}
          <strong className="font-semibold text-foreground/60">Resilience</strong> = how shielded from AI ·{" "}
          <strong className="font-semibold text-foreground/60">Fit</strong> = matches your interests
        </p>

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
              <div className="text-foreground/60">
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/career/${result.code}`} className="text-xs text-blue-600 hover:underline">
            View full details →
          </Link>
          <FeedbackWidget code={result.code} />
        </div>
      </div>
    </details>
  );
}
