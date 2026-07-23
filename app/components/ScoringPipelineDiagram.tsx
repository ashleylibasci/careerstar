// The core-credibility diagram: four public data sources feed a deterministic
// scorer (pure functions), which produces the 0–100 score; the LLM only writes
// the plain-English "why" and never computes the number. Theme-aware — text and
// muted strokes use currentColor (= --foreground); blue-600 is the accent.
export default function ScoringPipelineDiagram({ className = "" }: { className?: string }) {
  // Token, not hex: dark mode swaps in the brighter cobalt partner automatically.
  const BLUE = "var(--color-blue-600)";
  return (
    <svg
      viewBox="0 0 880 470"
      className={`h-auto w-full ${className}`}
      role="img"
      style={{ color: "var(--foreground)" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>How every CareerStar score is made</title>
      <desc>
        Four public data sources feed a deterministic scorer of pure functions, which outputs a 0 to
        100 score. A language model only writes the plain-English explanation — it never computes the
        number and never sees your raw input.
      </desc>
      <defs>
        <marker id="sp-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={BLUE} />
        </marker>
        <marker id="sp-ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" opacity="0.5" />
        </marker>
      </defs>

      <text x="24" y="24" fontSize="16" fontWeight="600" fill="currentColor">How every score is made</text>

      {/* Tier 1 — data sources */}
      <g fontSize="12" fill="currentColor" textAnchor="middle">
        {[
          { x: 24, t: "BLS projections", s: "growth + pay" },
          { x: 230, t: "O*NET 68-d", s: "skills + knowledge" },
          { x: 436, t: "AI-exposure research", s: "task automatability" },
          { x: 642, t: "College Scorecard", s: "education ROI" },
        ].map((b) => (
          <g key={b.x}>
            <rect x={b.x} y={46} width={190} height={56} rx={10} fill={BLUE} fillOpacity={0.06} stroke={BLUE} strokeOpacity={0.32} />
            <text x={b.x + 95} y={72} fontSize={13.5} fontWeight={600}>{b.t}</text>
            <text x={b.x + 95} y={90} opacity={0.65}>{b.s}</text>
          </g>
        ))}
      </g>

      <g stroke={BLUE} strokeWidth={1.5} fill="none">
        <path d="M119 102 L119 148" markerEnd="url(#sp-ah)" />
        <path d="M325 102 L325 148" markerEnd="url(#sp-ah)" />
        <path d="M531 102 L531 148" markerEnd="url(#sp-ah)" />
        <path d="M737 102 L737 148" markerEnd="url(#sp-ah)" />
      </g>

      {/* Tier 2 — the deterministic scorer */}
      <rect x={24} y={150} width={808} height={150} rx={12} fill={BLUE} fillOpacity={0.08} stroke={BLUE} strokeWidth={2} />
      <text x={428} y={176} textAnchor="middle" fontSize={15} fontWeight={600} fill={BLUE}>Deterministic scorer</text>
      <text x={428} y={194} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.6}>pure functions · no ML · no database</text>
      <g fontSize={13} fill="currentColor" textAnchor="middle" fontFamily="var(--font-geist-mono), ui-monospace, monospace">
        <text x={428} y={222}>Return = growth + pay  (percentile-ranked)</text>
        <text x={428} y={244}>Risk = AI exposure + volatility</text>
        <text x={428} y={266}>RAV = Return × (1 − γ · Risk)</text>
        <text x={428} y={288}>Score = 100 · [ α · RAV + (1 − α) · Fit ]</text>
      </g>

      <path d="M290 300 L290 330" stroke={BLUE} strokeWidth={1.5} fill="none" markerEnd="url(#sp-ah)" />

      {/* Tier 3 — the output + the narrator branch */}
      <rect x={150} y={332} width={280} height={62} rx={11} fill={BLUE} stroke={BLUE} />
      <text x={290} y={360} textAnchor="middle" fontSize={16} fontWeight={600} fill="#ffffff">Score 0–100</text>
      <text x={290} y={380} textAnchor="middle" fontSize={12} fill="#ffffff" opacity={0.85}>+ stars · bulls &amp; bears · moat</text>

      <path d="M430 363 L556 363" stroke="currentColor" strokeOpacity={0.5} strokeWidth={1.5} fill="none" markerEnd="url(#sp-ahg)" strokeDasharray="5 3" />
      <text x={493} y={356} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.6}>score + safe tags</text>

      <rect x={560} y={332} width={272} height={62} rx={11} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="5 3" />
      <text x={696} y={360} textAnchor="middle" fontSize={14} fontWeight={600} fill="currentColor" opacity={0.8}>Claude narrates the &ldquo;why&rdquo;</text>
      <text x={696} y={380} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.6}>optional layer · never computes</text>

      <text x={24} y={438} fontSize={12.5} fill="currentColor" opacity={0.65}>
        The AI only writes the explanation — every number above it is auditable math.
      </text>
    </svg>
  );
}
