import Link from "next/link";
import { connection } from "next/server";
import { getRecentNegotiations } from "@/lib/queries";
import { headlineStatus } from "@/components/status";
import type { RecentNegotiation } from "@/components/types";

const dotByTone: Record<string, string> = {
  olive: "recent-item__dot--green",
  oxblood: "recent-item__dot--red",
  ochre: "recent-item__dot--amber",
  ink: "recent-item__dot--gray",
  faint: "recent-item__dot--gray",
};

function dotClass(negotiation: RecentNegotiation): string {
  const tone = headlineStatus({
    status: negotiation.status,
    order: negotiation.order,
  }).tone;
  return dotByTone[tone] ?? "recent-item__dot--gray";
}

/**
 * The six latest negotiations in the sidebar. Rendered inside a Suspense
 * boundary in the root layout so the shell itself stays static.
 */
export async function SidebarRecent() {
  await connection();
  const recent = await getRecentNegotiations(6);

  if (recent.length === 0) {
    return <p className="recent-item__status">No negotiations yet.</p>;
  }

  return (
    <div className="side-recent">
      <p className="side-group__label">Recent</p>
      {recent.map((negotiation) => {
        const status = headlineStatus({
          status: negotiation.status,
          order: negotiation.order,
        });
        return (
          <Link
            key={negotiation.id}
            href={`/negotiation/${negotiation.id}`}
            className="recent-item"
          >
            <span className={`recent-item__dot ${dotClass(negotiation)}`} />
            <span className="min-w-0">
              <span className="recent-item__sku">
                {negotiation.item.sku}
              </span>
              <span className="recent-item__status">{status.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarRecentFallback() {
  return (
    <div className="side-recent" aria-hidden="true">
      <p className="side-group__label">Recent</p>
      {[0, 1, 2].map((row) => (
        <div key={row} className="recent-item">
          <span className="recent-item__dot recent-item__dot--gray" />
          <span className="h-3 w-20 rounded bg-rule" />
        </div>
      ))}
    </div>
  );
}
