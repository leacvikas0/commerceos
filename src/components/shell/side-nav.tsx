"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { group: "Buyer", items: [{ href: "/", label: "Requisition" }] },
  { group: "Vendor", items: [{ href: "/vendor", label: "Review desk" }] },
];

/** Sidebar navigation with the current workspace marked by a quiet fill. */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspaces">
      {nav.map((section) => (
        <div key={section.group} className="side-group">
          <p className="side-group__label">{section.group}</p>
          {section.items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`side-link${active ? " side-link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
