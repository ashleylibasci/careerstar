"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ScoreResponse } from "@/lib/scorer/types";
import ScoreCard from "./ScoreCard";

const EXAMPLES = [
  "Software engineer",
  "Nurse",
  "Teacher",
  "Data scientist",
  "Lawyer",
  "Marketing",
  "Mechanical engineer",
  "Graphic designer",
];

interface OccOption {
  code: string;
  title: string;
}

export default function CareerForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ScoreResponse | null>(null);

  // Autocomplete
  const [occs, setOccs] = useState<OccOption[]>([]);
  const [search, setSearch] = useState("");

  // Priority slider (0 = AI risk matters little … 1 = a lot). 0.5 → default model.
  const [riskPriority, setRiskPriority] = useState(0.5);
  const [lastQuery, setLastQuery] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/occupations")
      .then((r) => r.json())
      .then((d) => setOccs(d.occupations ?? []))
      .catch(() => {});
  }, []);

  async function runScore(query: string, rp = riskPriority) {
    if (query.trim().length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setLastQuery(query);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, riskPriority: rp }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
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

  function onSliderChange(value: number) {
    setRiskPriority(value);
    if (!lastQuery) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runScore(lastQuery, value), 350);
  }

  const suggestions =
    search.trim().length >= 2
      ? occs
          .filter((o) => o.title.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 8)
      : [];

  const isEmpty = text.trim().length === 0;

  return (
    <div className="w-full">
      {/* Autocomplete search across all careers */}
      <div className="relative mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search any career (e.g. nurse, lawyer, data scientist)…"
          className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-sm shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-foreground/15 bg-background shadow-lg">
            {suggestions.map((o) => (
              <li key={o.code}>
                <button
                  type="button"
                  onClick={() => {
                    setText(o.title);
                    setSearch("");
                    void runScore(o.title);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-500/10"
                >
                  {o.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runScore(text);
        }}
      >
        <label htmlFor="interests" className="mb-2 block text-sm font-medium text-foreground/80">
          …or describe what you&rsquo;re weighing and your interests
        </label>
        <textarea
          id="interests"
          name="interests"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. I like helping people and science — considering nursing, medicine, or research."
          className="w-full resize-y rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base leading-relaxed shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />

        <div className="mt-3">
          <div className="mb-1.5 text-xs text-foreground/50">Or try an example:</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex);
                  void runScore(ex);
                }}
                disabled={loading}
                className="rounded-full border border-foreground/15 bg-foreground/[.03] px-3 py-1 text-sm text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={isEmpty || loading}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            {loading ? "Scoring…" : "Rate my paths"}
          </button>
        </div>
      </form>

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
          {/* Priority slider — live sensitivity analysis */}
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
              onChange={(e) => onSliderChange(Number(e.target.value))}
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
