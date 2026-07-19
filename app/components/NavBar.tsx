"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandWordmark } from "./Brand";

// Site nav: a compact pill bar on desktop; a logo + hamburger dropdown on mobile
// so the sticky header stays ~50px instead of wrapping to a tall block.

const LINKS = [
  { href: "/", label: "Rate careers" },
  { href: "/explore", label: "Explore" },
  { href: "/top-20", label: "Top 20" },
  { href: "/methodology", label: "Methodology" },
  { href: "/architecture", label: "How it’s built" },
  { href: "/case-study", label: "Case study", accent: true },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Close the mobile menu on route change (render-time reset, no effect needed).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/85 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-3xl items-center gap-x-2 px-4 py-2.5 sm:px-6 lg:max-w-5xl xl:max-w-6xl">
        <Link
          href="/"
          aria-label="CareerStar home"
          className="mr-auto flex items-center text-foreground"
        >
          <BrandWordmark size={19} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 text-sm sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={
                l.accent
                  ? `rounded-full px-3.5 py-1.5 font-semibold transition ${
                      isActive(l.href)
                        ? "bg-blue-600 text-white"
                        : "bg-blue-600/10 text-blue-700 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white"
                    }`
                  : `rounded-full px-3 py-1.5 transition ${
                      isActive(l.href)
                        ? "bg-foreground/[.07] font-semibold text-foreground"
                        : "text-foreground/65 hover:bg-foreground/[.05] hover:text-foreground"
                    }`
              }
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/15 text-foreground/70 sm:hidden"
        >
          <span aria-hidden className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-foreground/10 px-4 pb-3 pt-1 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                isActive(l.href)
                  ? "bg-foreground/[.07] font-semibold text-foreground"
                  : l.accent
                    ? "font-semibold text-blue-600"
                    : "text-foreground/75 hover:bg-foreground/[.05]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
