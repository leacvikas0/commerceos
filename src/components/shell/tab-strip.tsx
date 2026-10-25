import { connection } from "next/server";
import { getPendingOfferCount, getRecentNegotiations } from "@/lib/queries";
import { headlineStatus } from "@/components/status";
import { TabBar, type TabItem } from "./tab-bar";

const filedTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Tab data for the shell. Rendered inside a Suspense boundary in the root
 * layout so the page content is not blocked by the tab strip.
 *
 * Two negotiations can be for the same item, which would make two identical
 * tabs. When that happens the second tab is labelled with its filed time
 * instead of the item name, so the tabs stay distinguishable.
 */
export async function TabStrip() {
  await connection();

  const [recent, pendingCount] = await Promise.all([
    getRecentNegotiations(4),
    getPendingOfferCount(),
  ]);

  const skuCounts = new Map<string, number>();
  for (const negotiation of recent) {
    skuCounts.set(
      negotiation.item.sku,
      (skuCounts.get(negotiation.item.sku) ?? 0) + 1,
    );
  }

  const items: TabItem[] = recent.map((negotiation) => {
    const filed = filedTime.format(negotiation.createdAt);
    const duplicate = (skuCounts.get(negotiation.item.sku) ?? 0) > 1;

    return {
      id: negotiation.id,
      sku: negotiation.item.sku,
      itemName: duplicate ? filed : negotiation.item.name,
      title: `${negotiation.item.name} · filed ${filed}`,
      tone: headlineStatus({
        status: negotiation.status,
        order: negotiation.order,
      }).tone,
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
