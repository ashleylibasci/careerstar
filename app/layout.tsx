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
  title: "CareerStar — AI Career Viability Rating",
  description:
    "Rate the career paths you're weighing like stocks: a data-grounded, risk-adjusted 0–100 viability score for an AI-shaped economy.",
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
        <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/80 px-6 py-3 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl items-center gap-x-5 text-sm">
            <Link href="/" className="font-bold text-blue-600">★ CareerStar</Link>
            <div className="flex gap-x-5 text-foreground/60">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <Link href="/methodology" className="hover:text-foreground">Methodology</Link>
              <Link href="/architecture" className="hover:text-foreground">How it&rsquo;s built</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
