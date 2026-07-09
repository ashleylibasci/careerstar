"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ScoreResponse } from "@/lib/scorer/types";
import { FIELDS } from "@/lib/fields";
import ScoreCard from "./ScoreCard";
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

export default function CareerForm() {
  const [occs, setOccs] = useState<OccOption[]>([]);
  const [search, setSearch] = useState("");
  const [careers, setCareers] = useState<CareerChip[]>([]);
  const [fields, setFields] = useState<FieldChip[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ScoreResponse | null>(null);
  const [riskPriority, setRiskPriority] = useState(0.5);
  const [copied, setCopied] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

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
    riskPriority: number;
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

  function runScore(rp = riskPriority) {
    if (!hasInput || loading) return;
    void postScore({
      careerCodes: careers.map((c) => c.code),
      fieldGroups: fields.map((f) => f.group),
      interests,
      text,
      riskPriority: rp,
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
        riskPriority: 0.5,
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

  function onSlider(v: number) {
    setRiskPriority(v);
    if (!response) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runScore(v), 350);
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
      <p className="mb-5 text-sm text-foreground/60">
        Add careers or fields, pick your interests, or both — whatever you&rsquo;ve got.
      </p>

      {/* Zone 1 — careers or fields */}
      <div className="relative">
        <label htmlFor="career-search" className="block text-sm font-semibold">
          Careers or fields to compare
        </label>
        <p className="mb-2 text-xs text-foreground/50">
          Pick specific jobs, or add a whole field.
        </p>
        <input
          id="career-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search e.g. nurse, software, lawyer, welder…"
          className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        {(careerMatches.length > 0 || fieldMatches.length > 0) && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-foreground/15 bg-background shadow-lg">
            {careerMatches.length > 0 && (
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/40">
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
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/40">
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
                {f.name} <span className="text-foreground/40">— whole field</span>
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

      {/* and / or divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-foreground/10" />
        <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs text-foreground/50">
          and / or
        </span>
        <div className="h-px flex-1 bg-foreground/10" />
      </div>

      {/* Zone 2 — interests */}
      <div>
        <label className="block text-sm font-semibold">Your interests</label>
        <p className="mb-2 text-xs text-foreground/50">
          Optional — tailors the scores to you.
        </p>
        <div className="flex flex-wrap gap-2">
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
          className="mt-3 w-full resize-y rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm leading-relaxed shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => runScore()}
          disabled={!hasInput || loading}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          {loading ? "Scoring…" : "Rate my paths"}
        </button>
      </div>

      {error && (
        <p aria-live="polite" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {response?.message && (
        <p className="mt-6 text-sm text-foreground/60">{response.message}</p>
      )}

      {response && response.results.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground/70">
              {response.results.length} {response.results.length === 1 ? "path" : "paths"} scored
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground"
            >
              {copied ? "✓ Copied!" : "🔗 Copy link"}
            </button>
          </div>

          {response.results.length >= 2 && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <FrontierChart results={response.results} />
              <CompareRadar results={response.results} />
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[.02] p-4">
            <label htmlFor="risk" className="block text-sm font-medium">
              How much should AI &amp; automation risk count?
            </label>
            <input
              id="risk"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={riskPriority}
              aria-label="How much should AI and automation risk count"
              aria-valuetext={`${Math.round(riskPriority * 100)}% weight on AI risk`}
              onChange={(e) => onSlider(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-foreground/50">
              <span>A little (reward upside)</span>
              <span>A lot (punish AI-risk)</span>
            </div>
          </div>

          <div className="space-y-4">
            {response.results.map((result, i) => (
              <ScoreCard key={result.code} result={result} top={i === 0} />
            ))}
          </div>

          <p className="pt-4 text-xs leading-relaxed text-foreground/50">
            A grounded estimate, not a prediction. Scores blend official BLS 2024&ndash;2034
            projections with AI-exposure research — and <strong>AI exposure is not the same as
            job loss</strong>. See{" "}
            <Link href="/methodology" className="underline hover:text-foreground/70">
              how scores are calculated
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
