import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import { BrandWordmark } from "./components/Brand";
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
  metadataBase: new URL("https://ashleylibasci.com"),
  title: "CareerStar — AI Career Viability Rating",
  alternates: { canonical: "/" },
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
        {/* Brand typeface (Utile Display Black) via Adobe Fonts. */}
        <link rel="stylesheet" href="https://use.typekit.net/hko8vsb.css" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:rounded-lg focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <NavBar />
        <div id="main-content" className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-foreground/10 px-6 py-6 print:hidden">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-foreground/60 lg:max-w-5xl xl:max-w-6xl">
            <span className="w-full">
              <BrandWordmark size={15} />
            </span>
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
