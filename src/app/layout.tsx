import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SideNav } from "@/components/shell/side-nav";
import {
  SidebarRecent,
  SidebarRecentFallback,
} from "@/components/shell/sidebar-recent";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#desk"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-xs focus:text-paper"
        >
          Skip to content
        </a>

        <div className="app">
          <aside className="sidebar">
            <div className="sidebar__brand">
              <Link href="/" className="sidebar__wordmark">
                CommerceOS
              </Link>
              <span className="sidebar__caption">Procurement</span>
            </div>

            <div className="sidebar__body">
              <SideNav />
              <Suspense fallback={<SidebarRecentFallback />}>
                <SidebarRecent />
              </Suspense>
            </div>

            <div className="sidebar__foot">Demo — no payments processed</div>
          </aside>

          <div className="app__main">
            <main id="desk">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
