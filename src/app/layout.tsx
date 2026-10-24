import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CommerceOS — Procurement workspace",
    template: "%s · CommerceOS",
  },
  description:
    "A working procurement workspace: buyer and supplier agents negotiate bulk purchases, and borderline offers come to a human vendor for a decision.",
};

const desks = [
  { href: "/", label: "Buyer" },
  { href: "/vendor", label: "Vendor" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#desk"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-xs focus:text-paper"
        >
          Skip to content
        </a>

        <header className="site-head">
          <div className="wrap site-head__inner">
            <Link href="/" className="brand">
              <span className="brand__name">CommerceOS</span>
              <span className="brand__tag hidden sm:inline">Procurement</span>
            </Link>

            <nav aria-label="Workspaces" className="site-nav">
              {desks.map((desk) => (
                <Link
                  key={desk.href}
                  href={desk.href}
                  className="site-nav__link"
                >
                  {desk.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main id="desk">{children}</main>

        <footer className="site-foot">
          <div className="wrap site-foot__inner">
            <p>CommerceOS — procurement workspace</p>
            <p>Demonstration only. No payments are processed.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
