import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://main.d3ag7o87gtn2c8.amplifyapp.com"),
  title: "CareerStar — AI Career Viability Rating",
  description:
    "Rate the career paths you're weighing like stocks: a data-grounded, risk-adjusted 0–100 viability score for an AI-shaped economy.",
  authors: [{ name: "Ashley Libasci", url: "https://github.com/ashleylibasci" }],
  openGraph: {
    title: "CareerStar — rate careers like stocks",
    description:
      "A data-grounded, risk-adjusted 0–100 viability score for every career path in an AI-shaped economy — with the math shown.",
    url: "/",
    siteName: "CareerStar",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CareerStar — rate careers like stocks" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "CareerStar — rate careers like stocks",
    description:
      "A data-grounded, risk-adjusted 0–100 career viability score for an AI-shaped economy — with the math shown.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/80 px-6 py-3 backdrop-blur print:hidden">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href="/" aria-label="CareerStar home" className="font-bold text-blue-600">
              <span aria-hidden="true">★ </span>CareerStar
            </Link>
            <div className="flex flex-wrap gap-x-4 text-foreground/60">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <Link href="/explore" className="hover:text-foreground">Explore</Link>
              <Link href="/top-20" className="hover:text-foreground">Top 20</Link>
              <Link href="/methodology" className="hover:text-foreground">Methodology</Link>
              <Link href="/architecture" className="hover:text-foreground">How it&rsquo;s built</Link>
              <Link href="/case-study" className="font-medium text-blue-600 hover:text-blue-700">Case study</Link>
            </div>
          </nav>
        </header>
        <div id="main-content" className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-foreground/10 px-6 py-6">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-foreground/60">
            <span className="w-full text-[11px] text-foreground/45">
              Data: BLS Employment Projections 2024–2034 · O*NET 29.0 · Eloundou et&nbsp;al. 2023 ·
              College Scorecard — refreshed 2026-07-09
            </span>
            <span>
              Built by <span className="font-semibold text-foreground/80">Ashley Libasci</span> — Math + CS @ UIUC
            </span>
            <span className="flex flex-wrap gap-x-4">
              <a
                href="https://github.com/ashleylibasci/careerstar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                View source on GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/ashleylibasci/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
