import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import data from "@/data/data.json";
import educationData from "@/data/education.json";
import { fieldName } from "@/lib/fields";
import { roi } from "@/lib/education";
import type { Occupation } from "@/lib/scorer/types";

const OCCUPATIONS = (data as { occupations: Occupation[] }).occupations;

interface EduRow {
  earn1yr: number | null;
  debt: number | null;
  programs: number;
  majors: string[];
  schools: { name: string; state: string; cost: number | null; earn10: number | null; admRate: number | null }[];
}
const EDUCATION = (educationData as { education: Record<string, EduRow> }).education;

function findOccupation(code: string): Occupation | undefined {
  return OCCUPATIONS.find((o) => o.code === code);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const occ = findOccupation(code);
  if (!occ) return { title: "Career not found — CareerStar" };
  return {
    title: `${occ.title} — CareerStar`,
    description: `Projected growth, median pay, and AI exposure for ${occ.title}.`,
  };
}

function Stat({
  label,
  value,
  caveat,
}: {
  label: string;
  value: string;
  caveat?: string;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {caveat ? (
        <div className="mt-1 text-xs text-foreground/60">{caveat}</div>
      ) : null}
    </div>
  );
}

export default async function CareerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const occ = findOccupation(code);
  if (!occ) notFound();

  const group = code.slice(0, 2);
  const related = OCCUPATIONS.filter(
    (o) => o.code.slice(0, 2) === group && o.code !== code,
  ).slice(0, 6);
  const edu = EDUCATION[code.split(".")[0]];

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <article className="w-full max-w-2xl">
        <Link href="/explore" className="text-sm text-blue-600 hover:underline">
          ← Back to explore
        </Link>

        <p className="mt-4 text-sm font-medium text-foreground/60">
          {fieldName(group)}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{occ.title}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Typically requires {occ.education || "no formal credential"} · ROI ≈ $
          {roi(occ.medianPay, occ.education).toLocaleString()}/yr of schooling
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            label="Projected growth"
            value={`${occ.growthPct >= 0 ? "+" : ""}${occ.growthPct}%`}
          />
          <Stat
            label="Median pay"
            value={`$${occ.medianPay.toLocaleString()}`}
          />
          <Stat
            label="AI exposure"
            value={`${Math.round(occ.aiExposure * 100)}/100`}
            caveat="share of tasks exposed to AI — not job loss"
          />
        </div>

        {edu ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Education &amp; ROI — how to get here</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Real outcomes for the college majors that feed this occupation, across{" "}
              {edu.programs.toLocaleString()} bachelor&rsquo;s programs.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Stat
                label="Median earnings"
                value={edu.earn1yr ? `$${edu.earn1yr.toLocaleString()}` : "—"}
                caveat="1 year after graduating"
              />
              <Stat
                label="Typical debt"
                value={edu.debt ? `$${edu.debt.toLocaleString()}` : "—"}
                caveat="median federal debt"
              />
              <Stat
                label="Pay-to-debt"
                value={edu.earn1yr && edu.debt ? `${(edu.earn1yr / edu.debt).toFixed(1)}×` : "—"}
                caveat="first-year pay ÷ debt"
              />
            </div>

            {edu.majors.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Feeder majors
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {edu.majors.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-foreground/10 bg-foreground/[.03] px-3 py-1 text-xs text-foreground/70"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {edu.schools.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Selective schools offering these majors
                </div>
                <div className="mt-2 divide-y divide-foreground/10 overflow-hidden rounded-2xl border border-foreground/10">
                  {edu.schools.map((s) => (
                    <div key={s.name} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-foreground/60">
                          {s.state}
                          {s.admRate != null ? ` · ${Math.round(s.admRate * 100)}% admit rate` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs tabular-nums">
                        {s.cost != null ? (
                          <div className="text-foreground/60">${s.cost.toLocaleString()}/yr</div>
                        ) : null}
                        {s.earn10 != null ? (
                          <div className="font-medium text-emerald-600">${s.earn10.toLocaleString()} grad pay</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-foreground/60">
              Earnings &amp; debt from the U.S. Dept. of Education <strong>College Scorecard</strong>;
              majors mapped to this occupation via the NCES CIP→SOC crosswalk. A grounded ROI
              snapshot, not a guarantee — pay varies widely by school and specialty.
            </p>
          </div>
        ) : null}

        {occ.skills.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Interests &amp; skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {occ.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-foreground/10 bg-foreground/[.03] px-3 py-1 text-xs text-foreground/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <Link
            href={`/?careers=${code}`}
            className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Score this career →
          </Link>
        </div>

        {related.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight">Related careers</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((o) => (
                <Link
                  key={o.code}
                  href={`/career/${o.code}`}
                  className="rounded-2xl border border-foreground/10 p-4 hover:bg-foreground/[.03]"
                >
                  <div className="font-medium">{o.title}</div>
                  <div className="mt-1 text-xs text-foreground/60 tabular-nums">
                    {o.growthPct >= 0 ? "+" : ""}
                    {o.growthPct}% growth · ${o.medianPay.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}
