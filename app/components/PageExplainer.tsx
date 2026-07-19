// "What is this page?" — a collapsed-by-default disclosure that sits under a
// page's header. One shared component so every page explains itself in the
// same voice: first what you're looking at, then how to use it. Native
// <details> keeps it server-renderable — no client JS.

export default function PageExplainer({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-4 rounded-xl border border-blue-600/20 bg-blue-600/[.04] print:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-blue-700 outline-none transition hover:bg-blue-600/[.06] focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 [&::-webkit-details-marker]:hidden">
        <span aria-hidden>ⓘ</span>
        What is this page &amp; how do I use it?
        <span aria-hidden className="ml-auto text-xs text-blue-600/70 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-2 px-4 pb-3.5 pt-0.5 text-sm leading-relaxed text-foreground/75">
        {children}
      </div>
    </details>
  );
}
