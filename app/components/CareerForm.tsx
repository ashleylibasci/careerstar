"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { ScoreResponse } from "@/lib/scorer/types";
import ScoreCard from "./ScoreCard";

export default function CareerForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ScoreResponse | null>(null);

  const isEmpty = text.trim().length === 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEmpty || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="interests"
          className="mb-2 block text-sm font-medium text-foreground/80"
        >
          Your interests and the career paths you&rsquo;re weighing
        </label>
        <textarea
          id="interests"
          name="interests"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="e.g. I like math and problem-solving — I'm considering software engineering, data science, or quant finance."
          className="w-full resize-y rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base leading-relaxed shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <div className="mt-4 flex items-center gap-4">
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
        <div className="mt-8 space-y-4">
          {response.results.map((result) => (
            <ScoreCard key={result.code} result={result} />
          ))}
          <p className="pt-2 text-xs leading-relaxed text-foreground/50">
            A grounded estimate, not a prediction. Scores blend BLS growth &amp; pay
            (~2023) with AI-exposure research — and <strong>AI exposure is not the
            same as job loss</strong>. See{" "}
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
