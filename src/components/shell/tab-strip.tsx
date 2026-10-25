import { connection } from "next/server";
import { getPendingOfferCount, getRecentNegotiations } from "@/lib/queries";
import { headlineStatus, type Tone } from "@/components/status";
import { TabBar, type TabItem } from "./tab-bar";

const filedTimeToSecond = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Compact state words for duplicate tabs, where the item name is ambiguous. */
function shortState(tone: Tone): string {
  switch (tone) {
    case "waiting":
      return "Awaiting";
    case "confirmed":
      return "Confirmed";
    case "blocked":
      return "Blocked";
    default:
      return "Open";
  }
}

/**
 * Tab data for the shell. Rendered inside a Suspense boundary in the root
 * layout so the page content is not blocked by the tab strip.
 *
 * Two negotiations can be for the same item, which would make two identical
 * tabs. Duplicates are labelled with their state ("Awaiting", "Confirmed", …)
 * because that is what tells them apart in practice. If two duplicates are in
 * the same state, they are numbered in filing order instead.
 */
export async function TabStrip() {
  await connection();

  const [recent, pendingCount] = await Promise.all([
    getRecentNegotiations(4),
    getPendingOfferCount(),
  ]);

  const rows = recent.map((negotiation) => {
    const status = headlineStatus({
      status: negotiation.status,
      order: negotiation.order,
    });
    return { negotiation, status, label: shortState(status.tone) };
  });

  const skuCounts = new Map<string, number>();
  for (const row of rows) {
    const sku = row.negotiation.item.sku;
    skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  }

  const skuLabelCounts = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.negotiation.item.sku}@${row.label}`;
    skuLabelCounts.set(key, (skuLabelCounts.get(key) ?? 0) + 1);
  }

  const skuSeen = new Map<string, number>();

  const items: TabItem[] = rows.map(({ negotiation, status, label }) => {
    const sku = negotiation.item.sku;
    const duplicate = (skuCounts.get(sku) ?? 0) > 1;
    const sameState = (skuLabelCounts.get(`${sku}@${label}`) ?? 0) > 1;

    const seen = (skuSeen.get(sku) ?? 0) + 1;
    skuSeen.set(sku, seen);

    const tabLabel = duplicate ? (sameState ? `#${seen}` : label) : negotiation.item.name;
    const filed = filedTimeToSecond.format(negotiation.createdAt);

    return {
      id: negotiation.id,
      sku,
      itemName: tabLabel,
      title: `${negotiation.item.name} · ${status.label} · filed ${filed}`,
      tone: status.tone,
    };
  });

  return <TabBar items={items} pendingCount={pendingCount} />;
}

export function TabStripFallback() {
  return (
    <div className="tabstrip__scroll" aria-hidden="true">
      <span className="tab-skeleton" />
      <span className="tab-skeleton" />
      <span className="tab-skeleton" />
    </div>
  );
}
