"use client";

import { useState } from "react";
import type { ScoreResult } from "@/lib/scorer/types";

// Client-side "share my results" card: renders the top-rated career as a
// branded 1200x630 PNG via SVG -> canvas, downloaded locally. No server, no
// storage — consistent with the app being stateless.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STAR = "M13 1l3.1 6.9 7.5.9-5.6 5.1 1.5 7.4L13 17.6 6.5 21.3 8 13.9 2.4 8.8l7.5-.9z";

function starRow(x: number, y: number, stars: number): string {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const fill = i < stars ? "#059669" : "#d4d4d8";
    out += `<g transform="translate(${x + i * 34},${y}) scale(1.15)"><path d="${STAR}" fill="${fill}"/></g>`;
  }
  return out;
}

function bar(x: number, y: number, w: number, label: string, value: number): string {
  const fillW = Math.round((Math.max(0, Math.min(100, value)) / 100) * w);
  return `
    <text x="${x}" y="${y}" font-size="19" font-weight="600" fill="#71717a" font-family="ui-sans-serif, -apple-system, 'Segoe UI', sans-serif">${esc(label)}</text>
    <text x="${x + w}" y="${y}" font-size="19" font-weight="600" fill="#3f3f46" text-anchor="end" font-family="ui-sans-serif, -apple-system, 'Segoe UI', sans-serif">${value}</text>
    <rect x="${x}" y="${y + 12}" width="${w}" height="9" rx="4.5" fill="#e4e4e7"/>
    <rect x="${x}" y="${y + 12}" width="${fillW}" height="9" rx="4.5" fill="#1d4ed8"/>`;
}

function buildSvg(r: ScoreResult): string {
  const resilience = 100 - r.components.risk;
  const moatLabel =
    r.moat === "wide" ? "🏰 WIDE MOAT" : r.moat === "narrow" ? "🛡 NARROW MOAT" : null;
  const pct =
    r.percentile != null && r.percentile >= 50 ? `top ${Math.max(1, 100 - r.percentile)}% of careers` : null;
  const sans = "ui-sans-serif, -apple-system, 'Segoe UI', sans-serif";
  const title = r.path.length > 34 ? r.path.slice(0, 33) + "…" : r.path;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="522" width="1200" height="2" fill="#eef2f7"/>
  <g transform="translate(72,52)">
    <path d="M8.86 4.12Q9.29 1.73 10.79 3.64L12.01 5.19Q13.99 7.69 17.14 7.26L19.09 6.99Q21.50 6.66 20.15 8.68L19.06 10.32Q17.29 12.97 18.67 15.84L19.53 17.61Q20.58 19.80 18.24 19.14L16.35 18.61Q13.28 17.74 10.98 19.94L9.56 21.31Q7.80 22.98 7.71 20.56L7.63 18.59Q7.51 15.41 4.70 13.90L2.96 12.97Q0.83 11.82 3.10 10.98L4.95 10.30Q7.94 9.19 8.51 6.06Z" fill="#1d4ed8" transform="scale(1.5)"/>
    <text x="46" y="27" font-size="30" font-weight="700" fill="#171717" font-family="${sans}" letter-spacing="-0.5">Career</text>
    <text x="140" y="27" font-size="30" font-weight="700" fill="#1d4ed8" font-family="${sans}" letter-spacing="-0.5">Star</text>
  </g>
  <text x="72" y="170" font-size="24" font-weight="600" fill="#94a3b8" letter-spacing="4" font-family="${sans}">MY CAREER RATING</text>
  <text x="72" y="248" font-size="58" font-weight="700" fill="#171717" letter-spacing="-1.5" font-family="${sans}">${esc(title)}</text>
  <text x="72" y="392" font-size="150" font-weight="700" fill="#1d4ed8" letter-spacing="-4" font-family="${sans}">${r.score}</text>
  <text x="${72 + String(r.score).length * 86 + 14}" y="392" font-size="42" font-weight="600" fill="#a1a1aa" font-family="${sans}">/100</text>
  ${r.stars != null ? starRow(76, 424, r.stars) : ""}
  ${pct ? `<text x="260" y="447" font-size="22" font-weight="600" fill="#52525b" font-family="${sans}">${esc(pct)}</text>` : ""}
  ${moatLabel ? `<g><rect x="72" y="470" width="${moatLabel.length * 13 + 40}" height="42" rx="21" fill="#dbeafe"/><text x="${92}" y="497" font-size="20" font-weight="600" fill="#1d4ed8" letter-spacing="1.5" font-family="${sans}">${moatLabel}</text></g>` : ""}
  ${bar(700, 190, 428, "Return", r.components.return)}
  ${bar(700, 265, 428, "Resilience", resilience)}
  ${bar(700, 340, 428, "Fit", r.components.fit)}
  <text x="700" y="447" font-size="19" fill="#71717a" font-family="${sans}">Return = growth + pay · Resilience = shielded from AI</text>
  <text x="72" y="576" font-size="21" font-weight="600" fill="#52525b" font-family="${sans}">Rate your own career paths — like stocks</text>
  <text x="1128" y="576" font-size="21" font-weight="600" fill="#1d4ed8" text-anchor="end" font-family="${sans}">main.d3ag7o87gtn2c8.amplifyapp.com</text>
</svg>`;
}

export default function DownloadResultsCard({ result }: { result: ScoreResult }) {
  const [busy, setBusy] = useState(false);

  const download = () => {
    setBusy(true);
    const svg = buildSvg(result);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = 1260;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, 1200, 630);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        setBusy(false);
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "my-careerstar-rating.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.onerror = () => {
      setBusy(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70 transition hover:border-blue-500/50 hover:text-foreground disabled:opacity-50"
      title="Download a shareable image of your top rating"
    >
      🖼 {busy ? "Rendering…" : "Share card"}
    </button>
  );
}
