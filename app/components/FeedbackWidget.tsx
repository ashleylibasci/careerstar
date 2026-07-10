"use client";

import { useState } from "react";

/** "Was this rating fair?" — the one-tap user-feedback loop (zero PII, logged server-side). */
export default function FeedbackWidget({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  async function vote(fair: boolean) {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fair }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-foreground/55 print:hidden">✓ Thanks — that feedback shapes the model.</p>;
  }
  if (state === "error") {
    return <p className="text-xs text-foreground/45 print:hidden">Couldn&rsquo;t record that — try again later.</p>;
  }
  return (
    <div className="flex items-center gap-2 text-xs text-foreground/55 print:hidden">
      <span>Was this rating fair?</span>
      <button
        type="button"
        onClick={() => vote(true)}
        aria-label="Yes, this rating seems fair"
        className="rounded-full border border-foreground/15 px-2.5 py-1 transition hover:border-emerald-500/50 hover:text-foreground"
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        aria-label="No, this rating seems off"
        className="rounded-full border border-foreground/15 px-2.5 py-1 transition hover:border-red-500/50 hover:text-foreground"
      >
        👎
      </button>
    </div>
  );
}
