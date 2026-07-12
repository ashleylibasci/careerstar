"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The site nav: logo left, pill links with an active state, case study as the
// accent CTA. Wraps cleanly on small screens; widens with the page on large ones.

const LINKS = [
  { href: "/", label: "Rate careers" },
  { href: "/explore", label: "Explore" },
  { href: "/top-20", label: "Top 20" },
  { href: "/methodology", label: "Methodology" },
  { href: "/architecture", label: "How it’s built" },
];

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/85 px-4 py-2.5 backdrop-blur sm:px-6 print:hidden">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1.5 lg:max-w-5xl xl:max-w-6xl">
        <Link
          href="/"
          aria-label="CareerStar home"
          className="mr-1 flex items-center gap-1.5 text-[17px] font-bold tracking-tight text-foreground"
        >
          <span aria-hidden="true" className="text-blue-600">★</span>
          CareerStar
        </Link>

        <div className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 transition ${
                isActive(l.href)
                  ? "bg-foreground/[.07] font-semibold text-foreground"
                  : "text-foreground/65 hover:bg-foreground/[.05] hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link
          href="/case-study"
          aria-current={pathname.startsWith("/case-study") ? "page" : undefined}
          className={`ml-auto rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            pathname.startsWith("/case-study")
              ? "bg-blue-600 text-white"
              : "bg-blue-600/10 text-blue-700 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white"
          }`}
        >
          Case study
        </Link>
      </nav>
    </header>
  );
}
