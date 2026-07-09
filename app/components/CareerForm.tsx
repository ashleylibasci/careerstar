"use client";

import { useState, type FormEvent } from "react";

export default function CareerForm() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isEmpty = text.trim().length === 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder only — Story 1.3 wires the /api/score endpoint and result card.
    // Story 1.2 is the input screen; no scoring happens yet.
    if (isEmpty) return;
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label
        htmlFor="interests"
        className="block text-sm font-medium text-foreground/80 mb-2"
      >
        Your interests and the career paths you&rsquo;re weighing
      </label>
      <textarea
        id="interests"
        name="interests"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (submitted) setSubmitted(false);
        }}
        rows={5}
        placeholder="e.g. I like math and problem-solving — I'm considering software engineering, data science, or quant finance."
        className="w-full resize-y rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base leading-relaxed shadow-sm outline-none transition placeholder:text-foreground/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={isEmpty}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          Rate my paths
        </button>
        {submitted && (
          <p aria-live="polite" className="text-sm text-foreground/60">
            Got it — the scoring engine comes online in the next build step.
          </p>
        )}
      </div>
    </form>
  );
}
