import Link from "next/link";

// One browse destination, three views. The nav lists only "Explore"; this
// switcher keeps the sibling views discoverable from any of them.
const VIEWS = [
  { href: "/explore", label: "📋 Table" },
  { href: "/sky", label: "✨ Sky map" },
  { href: "/top-20", label: "🏆 Top 20" },
];

export default function ViewSwitcher({ active }: { active: string }) {
  return (
    <div
      role="group"
      aria-label="Ways to browse the rated market"
      className="mt-4 inline-flex flex-wrap gap-1 rounded-full border border-foreground/15 p-1 text-sm"
    >
      {VIEWS.map((v) => (
        <Link
          key={v.href}
          href={v.href}
          aria-current={active === v.href ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition ${
            active === v.href
              ? "bg-blue-600 text-white"
              : "text-foreground/70 hover:bg-foreground/[.05] hover:text-foreground"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
