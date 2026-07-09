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
        {children}
        <footer className="mt-auto border-t border-foreground/10 px-6 py-5">
          <nav className="mx-auto flex max-w-xl flex-wrap gap-x-5 gap-y-1 text-sm text-foreground/50">
            <Link href="/" className="hover:text-foreground/80">Home</Link>
            <Link href="/methodology" className="hover:text-foreground/80">Methodology</Link>
            <Link href="/architecture" className="hover:text-foreground/80">How it&rsquo;s built</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
