"use client";

import { useState } from "react";
import { MOAT_BADGE } from "./rating-ui";

const EXPLAIN: Record<string, string> = {
  wide: "Wide = well-defended: few of its tasks are automatable, and it runs on skills few other jobs have.",
  narrow: "Narrow = some shelter: partly defended, but AI can reach a real share of its tasks.",
  none: "None = broadly exposed: many automatable tasks, widely shared skills. (Exposure ≠ job loss — see the bears.)",
};

/** The moat badge, click-to-explain — no hover required, works on touch. */
export default function MoatBadge({ moat }: { moat: string }) {
  const [open, setOpen] = useState(false);
  const b = MOAT_BADGE[moat];
  if (!b) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition hover:opacity-80 ${b.cls}`}
      >
        {b.label} <span aria-hidden className="font-normal normal-case opacity-70">{open ? "×" : "ⓘ"}</span>
      </button>
      {open && (
        <span className="w-full text-xs font-normal normal-case leading-snug tracking-normal text-foreground/70">
          A <strong>moat</strong> (from investing — the water defending a castle) = how{" "}
          <strong>shielded this career is from AI</strong>. {EXPLAIN[moat]}
        </span>
      )}
    </>
  );
}
