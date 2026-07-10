"use client";

/** "Save as PDF" via the browser's print dialog — the research-report handout. */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl border border-foreground/15 px-4 py-2 text-sm font-semibold transition hover:border-blue-500/50 print:hidden"
    >
      📄 Save report as PDF
    </button>
  );
}
