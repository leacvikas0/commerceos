import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TabStrip, TabStripFallback } from "@/components/shell/tab-strip";

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CommerceOS — Procurement workspace",
    template: "%s · CommerceOS",
  },
  description:
    "A working procurement workspace: buyer and supplier agents negotiate bulk purchases, and borderline offers come to a human vendor for a decision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#desk" className="skip-link">
          Skip to content
        </a>

        <div className="shell">
          <div className="tabstrip">
            <Link href="/" className="tabstrip__brand">
              CommerceOS
            </Link>
            <span className="tabstrip__divider" aria-hidden="true" />
            <Suspense fallback={<TabStripFallback />}>
              <TabStrip />
            </Suspense>
          </div>

          <main id="desk" className="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
