// The CareerStar identity, in one place: the tilted "Exponent" star and the
// Utile Display Black wordmark lockup. Chosen through a 9-round design
// exploration — wordmark in Utile, star raised to the shoulder like an
// exponent, B4 cobalt (#1d4ed8 = Tailwind blue-600 after the token remap).

// Continuously-rounded pentagram, tilted 14° — generated geometry, not hand-drawn.
export const TILTED_STAR_PATH =
  "M8.86 4.12Q9.29 1.73 10.79 3.64L12.01 5.19Q13.99 7.69 17.14 7.26L19.09 6.99Q21.50 6.66 20.15 8.68L19.06 10.32Q17.29 12.97 18.67 15.84L19.53 17.61Q20.58 19.80 18.24 19.14L16.35 18.61Q13.28 17.74 10.98 19.94L9.56 21.31Q7.80 22.98 7.71 20.56L7.63 18.59Q7.51 15.41 4.70 13.90L2.96 12.97Q0.83 11.82 3.10 10.98L4.95 10.30Q7.94 9.19 8.51 6.06Z";

export function TiltedStar({
  size = 14,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 25"
      aria-hidden
      className={`inline-block fill-blue-600 ${className}`}
      style={style}
    >
      <path d={TILTED_STAR_PATH} />
    </svg>
  );
}

// The wordmark lockup: Career (ink) + Star (cobalt) + the exponent star at the
// shoulder. `size` is the font size in px; the star scales and rises with it.
export function BrandWordmark({ size = 19, className = "" }: { size?: number; className?: string }) {
  const star = Math.round(size * 0.72);
  return (
    <span
      className={`relative inline-flex items-baseline whitespace-nowrap font-black ${className}`}
      style={{
        fontFamily: '"utile-display", var(--font-geist-sans), sans-serif',
        fontSize: size,
        letterSpacing: "-0.015em",
      }}
    >
      Career<span className="text-blue-600">Star</span>
      <TiltedStar
        size={star}
        className="relative"
        style={{ top: -Math.round(size * 0.5), left: Math.max(1, Math.round(size * 0.06)) }}
      />
    </span>
  );
}
