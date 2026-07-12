import type { ReactNode } from "react";

// A labeled, collapsible results section (native <details> — accessible, no JS).
// Divider-style header (not a card) so the panels inside keep their own styling
// without double-boxing. Keeps the answer front-and-center while the deeper
// analytics stay one tap away, with a benefit-driven label that says what's inside.
export default function ResultsSection({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-t border-foreground/10 print:hidden">
      <summary className="-mx-2 flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-3.5 transition hover:bg-foreground/[.03] [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-lg leading-none">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-foreground/55">{subtitle}</span>
        </span>
        <span
          aria-hidden
          className="shrink-0 text-xs font-medium text-foreground/45 transition-transform group-open:rotate-180"
        >
          ▼
        </span>
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}
