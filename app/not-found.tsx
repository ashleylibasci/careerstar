import Link from "next/link";
import Image from "next/image";
import { TiltedStar } from "./components/Brand";

// Custom 404 — the one page whose whole job is atmosphere + recovery. Career
// URLs genuinely go stale (SOC codes get reorganized between O*NET releases),
// so lost visitors are real traffic, not an edge case. The licensed star-trail
// long exposure (Adobe Stock #402236087, B4-cobalt duotone via Photoshop API)
// is the brand metaphor made literal: the sky circles one fixed point — and
// here the exponent star plays Polaris. The sky slowly rotates (motion-safe).

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <Image
        src="/star-trails-duotone.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover [transform-origin:50%_40%] motion-safe:animate-[sky-spin_240s_linear_infinite]"
      />
      <div className="absolute inset-0 bg-[#040a22]/50" />

      <div className="relative z-10 max-w-lg">
        <TiltedStar
          size={34}
          className="drop-shadow-[0_0_16px_rgba(140,170,255,0.95)]"
          style={{ fill: "#dbe6ff" }}
        />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-white/60">
          404 — page not found
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Lost? Navigate by your star.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/75">
          This page doesn&rsquo;t exist — the link may have gone stale (career codes occasionally
          change when the government reorganizes them). The sky here is a real long exposure,
          though: every star circles one fixed point. Pick yours.
        </p>

        {/* Recovery, not just consolation: a working career search (plain GET
            form → /explore?q=…, no client JS needed on an error page). */}
        <form action="/explore" className="mx-auto mt-8 flex max-w-sm items-center gap-2">
          <input
            type="text"
            name="q"
            maxLength={80}
            placeholder="Search a career… e.g. nurse, welder"
            aria-label="Search careers"
            className="w-full rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur transition placeholder:text-white/50 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/" className="text-white/85 underline-offset-4 transition hover:text-white hover:underline">
            Rate your career paths →
          </Link>
          <Link href="/explore" className="text-white/70 underline-offset-4 transition hover:text-white hover:underline">
            Explore all 730 careers
          </Link>
          <Link href="/top-20" className="text-white/70 underline-offset-4 transition hover:text-white hover:underline">
            The CareerStar 20
          </Link>
        </div>
      </div>

      {/* Even the 404 cites its sources. */}
      <p className="absolute bottom-3 right-4 z-10 text-[10px] text-white/40">
        Long exposure: Adobe Stock #402236087 · cobalt duotone via Photoshop API
      </p>
    </main>
  );
}
