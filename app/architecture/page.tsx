import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it's built — CareerStar",
  description:
    "CareerStar's system architecture: an offline data pipeline, a deterministic scorer, an LLM explanation layer, and the decisions behind them.",
};

type Variant = "default" | "core" | "llm" | "sec";

const NODE_VARIANT: Record<Variant, string> = {
  default: "border-foreground/15 bg-foreground/[.03]",
  core: "border-blue-500 bg-blue-500/5 shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-blue-500/40",
  llm: "border-emerald-500 bg-emerald-500/5",
  sec: "border-amber-500 bg-amber-500/5",
};

function Node({
  title,
  desc,
  variant = "default",
}: {
  title: string;
  desc: string;
  variant?: Variant;
}) {
  return (
    <div
      className={`w-[130px] shrink-0 rounded-xl border p-2.5 ${NODE_VARIANT[variant]}`}
    >
      <div className="text-[13px] font-semibold leading-tight">{title}</div>
      <div className="mt-1 text-[11px] leading-snug text-foreground/55">{desc}</div>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-1 text-foreground/55">
      <span className="text-lg font-bold leading-none">→</span>
      {label && (
        <span className="mt-0.5 text-center text-[9px] font-medium leading-none">
          {label}
        </span>
      )}
    </div>
  );
}

function Zone({
  label,
  dotClass,
  children,
}: {
  label: string;
  dotClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[.015] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground/60">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        {label}
      </div>
      <div className="overflow-x-auto">
        <div className="flex w-max min-w-full items-stretch gap-2">{children}</div>
      </div>
    </div>
  );
}

const DECISIONS: { id: string; rule: string; prevents: string }[] = [
  { id: "AD-1", rule: "One Next.js app, TypeScript end to end", prevents: "a needless second service" },
  { id: "AD-2", rule: "Scorer is pure; the UI only renders", prevents: "two sources of truth drifting" },
  { id: "AD-3", rule: "Join offline, read at runtime", prevents: "fragile in-request data joins" },
  { id: "AD-4", rule: "The LLM explains, never decides", prevents: "the thin-wrapper failure" },
  { id: "AD-5", rule: "Free-text is data, not instructions", prevents: "prompt injection + cost abuse" },
  { id: "AD-6", rule: "Stateless — no accounts, no DB", prevents: "unneeded data-governance surface" },
  { id: "AD-7", rule: "AWS Amplify + Route 53, auto HTTPS", prevents: "ops sprawl + insecure config" },
];

export default function ArchitecturePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to CareerStar
        </Link>

        <header className="mt-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
            CareerStar · System Architecture
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Rate careers like stocks — one app, defensible by design
          </h1>
          <p className="mt-3 max-w-2xl text-foreground/70">
            A single full-stack Next.js app with a deterministic scoring engine at its
            core. An LLM explains the score; it never computes it. Free-text is treated
            as data, not instructions. Stateless, no database, deployed on AWS.
          </p>
        </header>

        <div className="mt-8 space-y-4">
          <Zone label="Offline data pipeline · runs once on the author's machine" dotClass="bg-foreground/40">
            <div className="flex shrink-0 flex-col gap-1.5">
              <Node title="BLS" desc="growth + pay · public domain" />
              <Node title="O*NET-SOC" desc="occupation codes" />
              <Node title="Eloundou" desc="AI exposure · MIT" />
            </div>
            <Arrow label="join" />
            <Node title="Crosswalk + join" desc="on SOC-2018 codes" />
            <Arrow />
            <Node title="data.json" desc="committed dataset" variant="core" />
          </Zone>

          <Zone label="Runtime · Next.js 16 app on AWS Amplify" dotClass="bg-blue-500">
            <Node title="Browser UI" desc="single screen · free-text" />
            <Arrow label="POST" />
            <Node title="Security gate" desc="validate · cap · rate-limit" variant="sec" />
            <Arrow />
            <Node title="Scorer" desc="pure · deterministic · 0–100" variant="core" />
            <Arrow label="score" />
            <Node title="Claude Haiku" desc="explanation only" variant="llm" />
            <Arrow />
            <Node title="Score cards" desc="+ why + redirect" />
          </Zone>

          <Zone label="Deployment" dotClass="bg-blue-500">
            <Node title="AWS Amplify" desc="SSR · CI/CD" />
            <Arrow />
            <Node title="Route 53" desc="custom domain" />
            <Arrow />
            <Node title="Auto HTTPS" desc="managed TLS" />
            <Arrow />
            <Node title="Env secrets" desc="server-side only" variant="sec" />
          </Zone>
        </div>

        <h2 className="mt-12 text-sm font-bold uppercase tracking-wider text-foreground/60">
          Architecture decisions
          <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
            7 invariants
          </span>
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DECISIONS.map((d) => (
            <div key={d.id} className="rounded-xl border border-foreground/10 p-3.5 shadow-sm">
              <div className="text-[13px] font-extrabold text-blue-600">{d.id}</div>
              <div className="mt-0.5 text-sm font-semibold">{d.rule}</div>
              <div className="mt-1 text-[13px] text-foreground/55">
                Prevents <span className="font-semibold text-amber-600">{d.prevents}</span>.
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1 border-t border-foreground/10 pt-4 text-[12px] text-foreground/60">
          <span>Next.js 16 · TypeScript</span>
          <span>Claude · claude-haiku-4-5</span>
          <span>Data: BLS · O*NET · Eloundou 2023</span>
          <span>Deploy: AWS Amplify + Route 53</span>
        </div>
      </div>
    </main>
  );
}
