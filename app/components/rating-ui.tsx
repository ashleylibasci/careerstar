// Shared Morningstar-style rating glyphs — used by the score cards and the
// career research report so the rating language is identical everywhere.

export const MOAT_BADGE: Record<string, { label: string; cls: string }> = {
  wide: { label: "🏰 Wide moat", cls: "bg-blue-500/12 text-blue-700 dark:text-blue-400" },
  narrow: { label: "🛡 Narrow moat", cls: "bg-foreground/8 text-foreground/70" },
  none: { label: "No moat", cls: "bg-foreground/8 text-foreground/60" },
};

const STAR_PATH = "M10 1l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77 4.79 17.5l.99-5.8-4.21-4.1 5.82-.85z";

/** 5 stars with half-star precision. `id` keeps clip paths unique per instance. */
export function Stars({
  value,
  colorClass,
  id,
  size = "h-4 w-4",
}: {
  value: number;
  colorClass: string;
  id: string;
  size?: string;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const frac = Math.max(0, Math.min(1, value - (i - 1)));
        const clipId = `star-${id}-${i}`;
        return (
          <svg key={i} viewBox="0 0 20 20" className={size}>
            {frac > 0 && frac < 1 && (
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width={20 * frac} height="20" />
                </clipPath>
              </defs>
            )}
            <path d={STAR_PATH} className="fill-foreground/15" />
            {frac >= 1 && <path d={STAR_PATH} className={colorClass} />}
            {frac > 0 && frac < 1 && <path d={STAR_PATH} className={colorClass} clipPath={`url(#${clipId})`} />}
          </svg>
        );
      })}
    </div>
  );
}
