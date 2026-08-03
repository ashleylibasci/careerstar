"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TiltedStar } from "./Brand";

// ⌘K everywhere: jump to any of the 730 careers or any page, keyboard-first.
// Opens on Cmd/Ctrl+K or the nav chip (which dispatches "careerstar:cmdk").
// The occupation list loads once, on first open — never on page load.

interface Occ {
  code: string;
  title: string;
  aliases: string[];
}

const PAGES: { href: string; label: string; hint: string }[] = [
  { href: "/rate", label: "Rate my paths", hint: "the rating engine" },
  { href: "/explore", label: "Explore all careers", hint: "table view" },
  { href: "/sky", label: "The career sky", hint: "constellation map" },
  { href: "/top-20", label: "The CareerStar 20", hint: "highest conviction" },
  { href: "/methodology", label: "How scores work", hint: "the math, in full" },
  { href: "/case-study", label: "Case study", hint: "for the curious & hiring" },
  { href: "/architecture", label: "How it’s built", hint: "the engineering" },
];

const sing = (w: string) => w.replace(/s$/, "");
function rank(o: Occ, q: string): number {
  const title = o.title.toLowerCase();
  const words = title.split(/[^a-z]+/);
  if (words.some((w) => sing(w) === sing(q))) return 0;
  if (title.startsWith(q)) return 1;
  if (words.some((w) => w.startsWith(q))) return 2;
  if (o.aliases.some((a) => a.toLowerCase().includes(q))) return 3;
  if (title.includes(q)) return 4;
  return 9;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [occs, setOccs] = useState<Occ[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetched = useRef(false);

  const show = useCallback(() => {
    setOpen(true);
    setQ("");
    setActive(0);
    if (!fetched.current) {
      fetched.current = true;
      fetch("/api/occupations")
        .then((r) => r.json())
        .then((d) => setOccs(d.occupations ?? []))
        .catch(() => setOccs([]));
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (!v) show();
          return !v;
        });
      }
    };
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener("careerstar:cmdk", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("careerstar:cmdk", onOpen);
    };
  }, [show]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const query = q.trim().toLowerCase();
  const careerHits =
    query.length >= 2 && occs
      ? occs
          .map((o) => ({ o, r: rank(o, query) }))
          .filter((x) => x.r < 9)
          .sort((a, b) => a.r - b.r)
          .slice(0, 7)
          .map((x) => x.o)
      : [];
  const pageHits = PAGES.filter(
    (p) => query.length < 2 || p.label.toLowerCase().includes(query) || p.hint.includes(query),
  ).slice(0, query.length < 2 ? 7 : 3);

  type Item = { key: string; label: string; hint: string; href: string; isCareer: boolean };
  const items: Item[] = [
    ...careerHits.map((o) => ({
      key: o.code,
      label: o.title,
      hint: o.code,
      href: `/career/${o.code}`,
      isCareer: true,
    })),
    ...pageHits.map((p) => ({ key: p.href, label: p.label, hint: p.hint, href: p.href, isCareer: false })),
  ];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active].href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Quick search"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-foreground/15 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-foreground/10 px-4">
          <TiltedStar size={14} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to any career or page…"
            aria-label="Search careers and pages"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-foreground/45"
          />
          <kbd className="rounded border border-foreground/15 px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
            esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {query.length >= 2 && occs === null && (
            <div className="px-4 py-3 text-sm text-foreground/55">Loading the 730…</div>
          )}
          {query.length >= 2 && occs !== null && careerHits.length === 0 && (
            <div className="px-4 py-3 text-sm text-foreground/55">
              No careers match &ldquo;{q.trim()}&rdquo; — try a shorter word.
            </div>
          )}
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(it.href)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                i === active ? "bg-blue-600/[.08]" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden className="text-foreground/40">
                  {it.isCareer ? "★" : "→"}
                </span>
                <span className="truncate font-medium">{it.label}</span>
              </span>
              <span className="num shrink-0 text-[11px] text-foreground/40">{it.hint}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-foreground/10 px-4 py-2 text-[10px] text-foreground/45">
          <span>
            <kbd className="rounded border border-foreground/15 px-1 py-0.5">↑</kbd>{" "}
            <kbd className="rounded border border-foreground/15 px-1 py-0.5">↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-foreground/15 px-1 py-0.5">↵</kbd> open
          </span>
          <span className="ml-auto">730 careers · 7 pages</span>
        </div>
      </div>
    </div>
  );
}
