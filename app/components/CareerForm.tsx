"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ScoreResponse } from "@/lib/scorer/types";
import { FIELDS } from "@/lib/fields";
import ScoreCard from "./ScoreCard";
import RobustnessPanel from "./RobustnessPanel";
import ModelComparison from "./ModelComparison";
import ResultsSection from "./ResultsSection";
import FrontierChart from "./FrontierChart";
import CompareRadar from "./CompareRadar";

interface OccOption {
  code: string;
  title: string;
  aliases: string[];
}
interface CareerChip {
  code: string;
  title: string;
}
interface FieldChip {
  group: string;
  name: string;
}

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

// AI-adoption scenarios: the multiplier scales each career's *effective* exposure,
// so faster adoption sinks exposed fields and lifts resilient ones — live.
const SCENARIOS: { label: string; value: number; caption: string }[] = [
  { label: "Slower", value: 0.6, caption: "AI adoption stalls — exposure matters less; AI-exposed fields recover ground." },
  { label: "Today", value: 1.0, caption: "Today's measured AI exposure — the baseline scores." },
  { label: "Faster", value: 1.35, caption: "AI adoption accelerates — exposed fields sink, resilient ones climb." },
  { label: "Aggressive", value: 1.7, caption: "Rapid, broad AI adoption — the risk axis dominates the ranking." },
];

export default function CareerForm() {
  const [occs, setOccs] = useState<OccOption[]>([]);
  const [search, setSearch] = useState("");
  const [careers, setCareers] = useState<CareerChip[]>([]);
  const [fields, setFields] = useState<FieldChip[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [showInterests, setShowInterests] = useState(false);
  // Interests are collapsed by default (one clear action up top); open them once
  // the user asks, or once they exist (shared link / example / prior pick).
  const interestsOpen = showInterests || interests.length > 0 || text.trim().length > 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ScoreResponse | null>(null);
  // Model-tuning sliders (each 0–1). Defaults reproduce the built-in weights.
  const [growthPay, setGrowthPay] = useState(0.5); // 0 = growth … 1 = pay
  const [gammaT, setGammaT] = useState(0.5); // AI-risk sensitivity
  const [fitT, setFitT] = useState(0.5); // 0 = market viability … 1 = personal fit
  const weightsRef = useRef({ growthPay: 0.5, gammaT: 0.5, fitT: 0.5, aiAdoption: 1 });
  const [aiAdoption, setAiAdoption] = useState(1); // AI-adoption scenario multiplier
  const [copied, setCopied] = useState(false);
  const [maximized, setMaximized] = useState<"frontier" | "radar" | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click a chart point/series → scroll to that career's card and flash it.
  function focusCard(code: string) {
    setMaximized(null);
    setHighlight(code);
    requestAnimationFrame(() =>
      document.getElementById(`card-${code}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight(null), 1800);
  }
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  function tunedWeights() {
    const w = weightsRef.current;
    return {
      wGrowth: 1 - w.growthPay,
      wPay: w.growthPay,
      gamma: 0.2 + 0.8 * w.gammaT,
      alpha: 0.9 - 0.4 * w.fitT,
      aiAdoption: w.aiAdoption,
    };
  }

  // AI-adoption scenario: rescale how hard exposure bites, then re-score live.
  function onScenario(value: number) {
    weightsRef.current = { ...weightsRef.current, aiAdoption: value };
    setAiAdoption(value);
    if (response) runScore(tunedWeights());
  }

  useEffect(() => {
    fetch("/api/occupations")
      .then((r) => r.json())
      .then((d) => setOccs(d.occupations ?? []))
      .catch(() => {});
  }, []);

  const hasInput =
    careers.length > 0 || fields.length > 0 || interests.length > 0 || text.trim().length > 0;

  async function postScore(payload: {
    careerCodes: string[];
    fieldGroups: string[];
    interests: string[];
    text: string;
    weights: Record<string, number>;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(d?.error ?? "Something went wrong. Please try again.");
        setResponse(null);
        return;
      }
      setResponse((await res.json()) as ScoreResponse);
    } catch {
      setError("Couldn't reach the scoring service. Please try again.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  function runScore(weights = tunedWeights()) {
    if (!hasInput || loading) return;
    void postScore({
      careerCodes: careers.map((c) => c.code),
      fieldGroups: fields.map((f) => f.group),
      interests,
      text,
      weights,
    });
  }

  // One-click demo: pre-fill a real comparison and score it (kills the blank-page problem).
  function runExample() {
    const example = [
      { code: "15-1252.00", title: "Software developers" },
      { code: "29-1141.00", title: "Registered nurses" },
      { code: "47-2031.00", title: "Carpenters" },
    ];
    const exampleInterests = ["math", "technology"];
    const cs = example.map((e) => {
      const o = occs.find((x) => x.code === e.code);
      return { code: e.code, title: o?.title ?? e.title };
    });
    setCareers(cs);
    setInterests(exampleInterests);
    void postScore({
      careerCodes: cs.map((c) => c.code),
      fieldGroups: [],
      interests: exampleInterests,
      text: "",
      weights: tunedWeights(),
    });
  }

  // Hydrate from a shared link once the occupation list is loaded.
  useEffect(() => {
    if (hydrated.current || occs.length === 0) return;
    const p = new URLSearchParams(window.location.search);
    const cCodes = (p.get("careers") || "").split(",").filter(Boolean);
    const fGroups = (p.get("fields") || "").split(",").filter(Boolean);
    const ints = (p.get("interests") || "").split(",").filter(Boolean);
    if (!cCodes.length && !fGroups.length && !ints.length) return;
    hydrated.current = true;
    const cs = cCodes
      .map((code) => occs.find((o) => o.code === code))
      .filter((o): o is OccOption => Boolean(o))
      .map((o) => ({ code: o.code, title: o.title }));
    const fs = fGroups
      .map((g) => FIELDS.find((f) => f.group === g))
      .filter((f): f is FieldChip => Boolean(f));
    queueMicrotask(() => {
      setCareers(cs);
      setFields(fs);
      setInterests(ints);
      void postScore({
        careerCodes: cs.map((c) => c.code),
        fieldGroups: fs.map((f) => f.group),
        interests: ints,
        text: "",
        weights: tunedWeights(),
      });
    });
  }, [occs]);

  function copyLink() {
    const p = new URLSearchParams();
    if (careers.length) p.set("careers", careers.map((c) => c.code).join(","));
    if (fields.length) p.set("fields", fields.map((f) => f.group).join(","));
    if (interests.length) p.set("interests", interests.join(","));
    const qs = p.toString();
    window.history.replaceState(null, "", `/?${qs}`);
    navigator.clipboard?.writeText(`${window.location.origin}/?${qs}`).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  function onTune(key: "growthPay" | "gammaT" | "fitT", value: number) {
    weightsRef.current = { ...weightsRef.current, [key]: value };
    if (key === "growthPay") setGrowthPay(value);
    else if (key === "gammaT") setGammaT(value);
    else setFitT(value);
    if (!response) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runScore(tunedWeights()), 350);
  }

  const q = search.trim().toLowerCase();
  const careerMatches =
    q.length >= 2
      ? occs
          .filter(
            (o) =>
              !careers.some((c) => c.code === o.code) &&
              (o.title.toLowerCase().includes(q) ||
                o.aliases.some((a) => a.toLowerCase().includes(q))),
          )
          .slice(0, 6)
      : [];
  const fieldMatches =
    q.length >= 2
      ? FIELDS.filter(
          (f) => f.name.toLowerCase().includes(q) && !fields.some((x) => x.group === f.group),
        ).slice(0, 3)
      : [];

  const chip =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm";

  return (
    <div className="w-full">
      {/* Input form stays readable-width; results below use the full container. */}
      <div className="mx-auto max-w-2xl">
      {/* Zone 1 — careers or fields (the one primary action) */}
      <div className="relative print:hidden">
        <label htmlFor="career-search" className="block text-sm font-semibold">
          Careers or fields to compare
        </label>
        <p className="mb-2 text-xs text-foreground/60">
          Pick specific jobs, or add a whole field.
        </p>
        <input
          id="career-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search e.g. nurse, software, lawyer, welder…"
          className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-foreground/55 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        {(careerMatches.length > 0 || fieldMatches.length > 0) && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-foreground/15 bg-background shadow-lg">
            {careerMatches.length > 0 && (
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/55">
                Careers
              </div>
            )}
            {careerMatches.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  setCareers((c) => [...c, { code: o.code, title: o.title }]);
                  setSearch("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-500/10"
              >
                {o.title}
              </button>
            ))}
            {fieldMatches.length > 0 && (
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/55">
                Fields
              </div>
            )}
            {fieldMatches.map((f) => (
              <button
                key={f.group}
                type="button"
                onClick={() => {
                  setFields((x) => [...x, f]);
                  setSearch("");
                }}
                className="block w-full px-3 py-2 text-left text-sm text-purple-700 hover:bg-purple-500/10"
              >
                {f.name} <span className="text-foreground/55">— whole field</span>
              </button>
            ))}
          </div>
        )}

        {(careers.length > 0 || fields.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {careers.map((c) => (
              <span key={c.code} className={`${chip} bg-blue-500/10 text-blue-700`}>
                {c.title}
                <button
                  type="button"
                  aria-label={`Remove ${c.title}`}
                  onClick={() => setCareers((x) => x.filter((y) => y.code !== c.code))}
                  className="hover:text-blue-900"
                >
                  ✕
                </button>
              </span>
            ))}
            {fields.map((f) => (
              <span key={f.group} className={`${chip} bg-purple-500/10 text-purple-700`}>
                {f.name}
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFields((x) => x.filter((y) => y.group !== f.group))}
                  className="hover:text-purple-900"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zone 2 — interests, collapsed by default so the empty state has one clear action */}
      {!interestsOpen ? (
        <button
          type="button"
          onClick={() => setShowInterests(true)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline print:hidden"
        >
          <span aria-hidden className="text-base leading-none">＋</span> Add your interests
          <span className="font-normal text-foreground/50">(optional — tailors the scores to you)</span>
        </button>
      ) : (
      <div className="mt-6 print:hidden">
        <div id="interests-label" className="block text-sm font-semibold">Your interests</div>
        <p className="mb-2 text-xs text-foreground/55">
          Optional — tailors the scores to you.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="interests-label">
          {INTERESTS.map((it) => {
            const on = interests.includes(it.value);
            return (
              <button
                key={it.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setInterests((x) =>
                    on ? x.filter((v) => v !== it.value) : [...x, it.value],
                  )
                }
                className={`${chip} transition ${
                  on
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "border border-foreground/15 text-foreground/60 hover:border-emerald-500/50"
                }`}
              >
                {on && <span aria-hidden>✓</span>}
                {it.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Anything else about you? e.g. I want to help people but also want stability."
          className="mt-3 w-full resize-y rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm leading-relaxed shadow-sm outline-none transition placeholder:text-foreground/55 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4 print:hidden">
        <button
          type="button"
          onClick={() => runScore()}
          disabled={!hasInput || loading}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          {loading ? "Scoring…" : "Rate my paths"}
        </button>
        {!response && !loading && (
          <button
            type="button"
            onClick={runExample}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            or see an example rating →
          </button>
        )}
      </div>

      {error && (
        <p aria-live="polite" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Skeletons for the first score, so the wait reads as progress, not silence. */}
      {loading && !response && (
        <div className="mt-8 space-y-4" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-foreground/10 bg-foreground/[.02] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="w-full">
                  <div className="h-4 w-1/3 rounded bg-foreground/10" />
                  <div className="mt-2 h-3 w-1/4 rounded bg-foreground/10" />
                </div>
                <div className="h-8 w-14 rounded bg-foreground/10" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="h-2 rounded bg-foreground/10" />
                <div className="h-2 rounded bg-foreground/10" />
                <div className="h-2 rounded bg-foreground/10" />
              </div>
              <div className="mt-4 h-3 w-2/3 rounded bg-foreground/10" />
            </div>
          ))}
        </div>
      )}
      {response?.message && (
        <p className="mt-6 text-sm text-foreground/60">{response.message}</p>
      )}
      </div>

      {response && response.results.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 hidden print:block">
            <div className="text-lg font-bold text-blue-600">★ CareerStar</div>
            <div className="text-xs text-foreground/60">Career analysis · careerstar.ashleylibasci.com</div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
            <h2 className="text-sm font-semibold text-foreground/70">
              {response.results.length} {response.results.length === 1 ? "path" : "paths"} scored
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground"
              >
                {copied ? "✓ Copied!" : "🔗 Copy link"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground"
              >
                📄 Download report
              </button>
            </div>
          </div>

          {/* The answer first — the analysis lives below it (Morningstar prints the
              rating, then the research). One clean column so each card reads at a
              comfortable width, ranked top-to-bottom. */}
          <div className="space-y-4">
            {response.results.map((result, i) => (
              <ScoreCard key={result.code} result={result} top={i === 0} highlighted={highlight === result.code} />
            ))}
          </div>

          {/* Portfolio check: warn when every compared path shares the same weakness. */}
          {response.results.length >= 2 &&
            response.results.every((r) => (r.breakdown?.aiExposurePct ?? 0) >= 60) && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[.06] p-3 text-sm print:hidden">
                <span aria-hidden>⚠️</span>
                <p className="text-foreground/75">
                  <strong>Your career portfolio isn&rsquo;t diversified</strong>{" "}— every path
                  you&rsquo;re comparing is high-AI-exposure. Like holding only one sector: fine if
                  you&rsquo;re right, painful if you&rsquo;re not. Consider adding a{" "}
                  <Link href="/explore?moat=wide" className="font-medium text-blue-600 hover:underline">
                    wide-moat option
                  </Link>{" "}
                  to the mix.
                </p>
              </div>
            )}

          {/* The visual summary sits right under the answer — charts are the payoff,
              shown for a single career (its position + profile) as well as a comparison. */}
          {response.results.length >= 1 && (
            <div className="mt-8 print:hidden">
              <div className="text-sm font-semibold">The picture</div>
              <p className="mb-3 mt-0.5 text-xs text-foreground/60">
                {response.results.length === 1
                  ? "Where this career sits on return vs. risk, and its profile across every axis. Tap ⤢ to enlarge."
                  : "Return vs. risk on the left; every axis compared on the right. Tap any point to jump to its card, or ⤢ to enlarge."}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FrontierChart results={response.results} onExpand={() => setMaximized("frontier")} onSelect={focusCard} />
                <CompareRadar results={response.results} onExpand={() => setMaximized("radar")} onSelect={focusCard} />
              </div>
            </div>
          )}

          {response.results.some((r) => r.moat) && (
            <p className="pt-4 text-xs leading-relaxed text-foreground/60">
              <strong>What&rsquo;s a &ldquo;moat&rdquo;?</strong> Borrowed from investing: the water
              around a castle that makes it hard to attack. Here it means how{" "}
              <strong>shielded a career is from AI</strong> — few of its tasks are automatable, and
              it relies on skills few other jobs have. 🏰 Wide = well-defended, 🛡 Narrow = some
              shelter, None = broadly exposed.
            </p>
          )}

          <p className="pt-4 text-xs leading-relaxed text-foreground/60">
            A grounded estimate, not a prediction. Scores blend official U.S. government job
            projections (2024&ndash;2034) with AI-exposure research — and <strong>AI exposure is
            not the same as job loss</strong>. See{" "}
            <Link href="/methodology" className="underline hover:text-foreground/70">
              how scores are calculated
            </Link>
            .
          </p>

          <div className="mb-1 mt-10 text-xs font-semibold uppercase tracking-wide text-foreground/45 print:hidden">
            Dig deeper — optional
          </div>

          <ResultsSection
            icon="🔮"
            title="Stress-test the scores"
            subtitle="Change the AI outlook or your priorities and watch the ranking react"
          >
            <div className="pt-1">
              <div className="text-sm font-semibold">If AI comes faster — or slower</div>
              <p className="mb-3 mt-0.5 text-xs text-foreground/60">
                The scores assume today&rsquo;s AI exposure. Pick a different future and the ranking
                re-scores live.
              </p>
              <div className="inline-flex flex-wrap gap-1 rounded-full border border-foreground/15 p-1" role="group" aria-label="AI-adoption scenario">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={aiAdoption === s.value}
                    onClick={() => onScenario(s.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      aiAdoption === s.value
                        ? "bg-blue-600 text-white"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-foreground/60">
                {SCENARIOS.find((s) => s.value === aiAdoption)?.caption ?? SCENARIOS[1].caption}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm font-semibold">Change what the score weighs</div>
                <button
                  type="button"
                  onClick={() => {
                    const adopt = weightsRef.current.aiAdoption; // keep the chosen scenario
                    weightsRef.current = { growthPay: 0.5, gammaT: 0.5, fitT: 0.5, aiAdoption: adopt };
                    setGrowthPay(0.5);
                    setGammaT(0.5);
                    setFitT(0.5);
                    if (response) runScore({ wGrowth: 0.5, wPay: 0.5, gamma: 0.6, alpha: 0.7, aiAdoption: adopt });
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Reset
                </button>
              </div>
              <p className="mb-4 mt-0.5 text-xs text-foreground/60">
                Move a slider and the rankings re-score live — see how much your priorities change
                the answer.
              </p>

              <label htmlFor="w-growthpay" className="block text-xs font-medium">Reward: growth vs. pay</label>
              <input
                id="w-growthpay" type="range" min={0} max={1} step={0.01} value={growthPay}
                aria-label="Balance growth versus pay"
                aria-valuetext={`${Math.round((1 - growthPay) * 100)} percent growth, ${Math.round(growthPay * 100)} percent pay`}
                onChange={(e) => onTune("growthPay", Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <div className="mb-4 mt-1 flex justify-between text-xs text-foreground/60"><span>Growth</span><span>Pay</span></div>

              <label htmlFor="w-gamma" className="block text-xs font-medium">How much should AI risk count?</label>
              <input
                id="w-gamma" type="range" min={0} max={1} step={0.01} value={gammaT}
                aria-label="How much should AI risk count"
                aria-valuetext={`${Math.round(gammaT * 100)} percent`}
                onChange={(e) => onTune("gammaT", Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <div className="mb-4 mt-1 flex justify-between text-xs text-foreground/60"><span>Ignore risk</span><span>Punish risk</span></div>

              <label htmlFor="w-fit" className="block text-xs font-medium">Weigh: market vs. personal fit</label>
              <input
                id="w-fit" type="range" min={0} max={1} step={0.01} value={fitT}
                aria-label="Balance market viability versus personal fit"
                aria-valuetext={`${Math.round((1 - fitT) * 100)} percent market, ${Math.round(fitT * 100)} percent fit`}
                onChange={(e) => onTune("fitT", Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <div className="mb-6 mt-1 flex justify-between text-xs text-foreground/60"><span>Market viability</span><span>Personal fit</span></div>

              {response.sensitivity && <RobustnessPanel sensitivity={response.sensitivity} />}
            </div>
          </ResultsSection>

          {response.results.length >= 2 && (
            <ResultsSection
              icon="🧮"
              title="Compare 5 rating models"
              subtitle="Does the answer hold under different philosophies? See where the judges disagree."
            >
              <div className="pt-1">
                <ModelComparison results={response.results} />
              </div>
            </ResultsSection>
          )}
        </div>
      )}

      {maximized && response && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden"
          onClick={() => setMaximized(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged chart"
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setMaximized(null)}
                aria-label="Minimize chart"
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground"
              >
                ✕ Minimize
              </button>
            </div>
            {maximized === "frontier" ? (
              <FrontierChart results={response.results} onSelect={focusCard} />
            ) : (
              <CompareRadar results={response.results} onSelect={focusCard} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
