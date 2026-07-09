"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FIELDS } from "@/lib/fields";
import { EDUCATION_LEVELS } from "@/lib/education";
import { scoreBand, type Tone } from "@/lib/scorer/verdict";

interface Row {
  code: string;
  title: string;
  score: number;
  growthPct: number;
  medianPay: number;
  aiExposurePct: number;
  resilience: number;
  group: string;
  field: string;
  education: string;
  educationShort: string;
  roi: number;
}

const TONE: Record<Tone, string> = {
  strong: "text-emerald-600",
  mixed: "text-amber-600",
  risky: "text-red-600",
};

const SORTS: { key: keyof Row; label: string }[] = [
  { key: "score", label: "Overall score" },
  { key: "resilience", label: "AI-resilience" },
  { key: "growthPct", label: "Projected growth" },
  { key: "medianPay", label: "Median pay" },
  { key: "roi", label: "Best ROI (pay ÷ schooling)" },
];

export default function ExploreClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [sortKey, setSortKey] = useState<keyof Row>("score");
  const [field, setField] = useState("all");
  const [edu, setEdu] = useState("all");
  const [minPay, setMinPay] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.careers ?? []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          (field === "all" || r.group === field) &&
          (edu === "all" || r.education === edu) &&
          r.medianPay >= minPay &&
          (q === "" || r.title.toLowerCase().includes(q)),
      )
      .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
      .slice(0, 150);
  }, [rows, sortKey, field, edu, minPay, search]);

  const inputCls =
    "rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search…"
          aria-label="Search careers"
          className={`${inputCls} flex-1 min-w-[140px]`}
        />
        <select aria-label="Filter by field" value={field} onChange={(e) => setField(e.target.value)} className={inputCls}>
          <option value="all">All fields</option>
          {FIELDS.map((f) => (
            <option key={f.group} value={f.group}>{f.name}</option>
          ))}
        </select>
        <select aria-label="Filter by education" value={edu} onChange={(e) => setEdu(e.target.value)} className={inputCls}>
          <option value="all">Any education</option>
          {EDUCATION_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select aria-label="Filter by minimum pay" value={minPay} onChange={(e) => setMinPay(Number(e.target.value))} className={inputCls}>
          <option value={0}>Any pay</option>
          <option value={50000}>$50k+</option>
          <option value={75000}>$75k+</option>
          <option value={100000}>$100k+</option>
          <option value={150000}>$150k+</option>
        </select>
        <select aria-label="Sort by" value={sortKey} onChange={(e) => setSortKey(e.target.value as keyof Row)} className={inputCls}>
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-xs text-foreground/60">
        {filtered.length} shown{filtered.length === 150 ? " (top 150)" : ""} · click a career for details
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-left text-xs text-foreground/60">
              <th scope="col" className="py-2 pr-3 font-medium">Career</th>
              <th scope="col" className="py-2 px-3 font-medium">Field</th>
              <th scope="col" className="py-2 px-3 font-medium">Education</th>
              <th scope="col" className="py-2 px-3 text-right font-medium">Score</th>
              <th scope="col" className="py-2 px-3 text-right font-medium">Growth</th>
              <th scope="col" className="py-2 px-3 text-right font-medium">Pay</th>
              <th scope="col" className="py-2 pl-3 text-right font-medium">Resilience</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.code} className="border-b border-foreground/5 hover:bg-foreground/[.03]">
                <td className="py-2 pr-3">
                  <Link href={`/career/${r.code}`} className="font-medium hover:text-blue-600 hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="py-2 px-3 text-foreground/60">{r.field}</td>
                <td className="py-2 px-3 text-foreground/60">{r.educationShort}</td>
                <td className={`py-2 px-3 text-right font-semibold tabular-nums ${TONE[scoreBand(r.score).tone]}`}>{r.score}</td>
                <td className="py-2 px-3 text-right tabular-nums text-foreground/70">
                  {r.growthPct >= 0 ? "+" : ""}{r.growthPct}%
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-foreground/70">
                  ${(r.medianPay / 1000).toFixed(0)}k
                </td>
                <td className="py-2 pl-3 text-right tabular-nums text-foreground/70">{r.resilience}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
