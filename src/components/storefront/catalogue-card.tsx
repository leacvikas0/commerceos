import { formatMoney } from "@/lib/format";
import type { StorefrontItem } from "@/components/types";

/** Catalogue summary: one row per item, cheapest listing first. */
export function CatalogueCard({ items }: { items: StorefrontItem[] }) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Catalogue</h2>
        <span className="card__sub">By list price</span>
      </div>
      <div>
        {items.map((item) => {
          const lowest = item.offers[0];
          return (
            <div
              key={item.id}
              className="border-b border-rule px-4 py-3 last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium">{item.name}</p>
                <p className="mono num shrink-0 text-[12px]">
                  {lowest
                    ? `from ${formatMoney(lowest.listPriceMinor, lowest.currency)}`
                    : "—"}
                </p>
              </div>
              <p className="mt-0.5 text-[11.5px] text-ink-faint">
                <span className="mono">{item.sku}</span> · {item.offers.length}{" "}
                suppliers · spec {item.specVersion}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
