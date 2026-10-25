"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tone } from "@/components/status";

export type TabItem = {
  id: string;
  sku: string;
  itemName: string;
  title: string;
  tone: Tone;
};

const dotClass: Record<Tone, string> = {
  waiting: "tab__dot--waiting",
  blocked: "tab__dot--blocked",
  confirmed: "tab__dot--confirmed",
  neutral: "tab__dot--neutral",
};

/**
 * The workspace tab strip. Tabs are navigation, not browser chrome: no close
 * buttons, no address bar, no window controls. The client-side jobs are
 * marking the active tab from the current pathname and keeping that tab in
 * view when the strip scrolls on narrow screens.
 */
export function TabBar({
  items,
  pendingCount,
}: {
  items: TabItem[];
  pendingCount: number;
}) {
  const pathname = usePathname();
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>(".tab--active");
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  const requisitionActive = pathname === "/";
  const vendorActive =
    pathname === "/vendor" || pathname.startsWith("/vendor/");

  return (
    <>
      <div className="tabstrip__scroll" ref={stripRef}>
        <Link
          href="/"
          className={`tab${requisitionActive ? " tab--active" : ""}`}
          aria-current={requisitionActive ? "page" : undefined}
        >
          Requisition
        </Link>

        {items.map((item) => {
          const href = `/negotiation/${item.id}`;
          const active = pathname === href;
          return (
            <Link
              key={item.id}
              href={href}
              title={item.title}
              aria-label={`${item.sku} — ${item.title}`}
              className={`tab${active ? " tab--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`tab__dot ${dotClass[item.tone]}`} />
              <span className="tab__sku">{item.sku}</span>
              <span className="tab__sep" aria-hidden="true">
                ·
              </span>
              <span className="tab__name">{item.itemName}</span>
            </Link>
          );
        })}
      </div>

      <div className="tabstrip__pinned">
        <span className="tabstrip__divider" aria-hidden="true" />
        <Link
          href="/vendor"
          className={`tab${vendorActive ? " tab--active" : ""}`}
          aria-current={vendorActive ? "page" : undefined}
        >
          {pendingCount > 0 ? (
            <span className="tab__dot tab__dot--waiting" />
          ) : null}
          Review desk
          {pendingCount > 0 ? (
            <span className="tab__count">{pendingCount}</span>
          ) : null}
        </Link>
      </div>
    </>
  );
}
