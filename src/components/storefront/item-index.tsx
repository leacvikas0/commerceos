import { formatMoney } from "@/lib/format";
import type { StorefrontItem } from "@/components/types";

/**
 * The item index: a read-only reference of every seeded listing, sorted by
 * list price. Buyer-safe: list prices and delivery only, never floors.
 */
export function ItemIndex({ items }: { items: StorefrontItem[] }) {
  return (
    <div className="flex flex-col gap-[1.1rem]">
      {items.map((item, itemIndex) => (
        <article key={item.id} className="panel panel--flush">
          <header className="flex items-baseline justify-between gap-3 border-b border-rule px-4 pt-3.5 pb-2.5">
            <div className="min-w-0">
              <h3 className="font-display text-[1.3rem] leading-tight">
                {item.name}
              </h3>
              <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-faint">
                {item.sku} · {item.specVersion}
              </p>
            </div>
            <span className="eyebrow eyebrow--faint shrink-0">
              {String(itemIndex + 1).padStart(2, "0")}
            </span>
          </header>

          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col" className="num">
                  List / unit
                </th>
                <th scope="col" className="num">
                  Days
                </th>
                <th scope="col" className="num">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {item.offers.map((offer) => (
                <tr key={`${item.id}-${offer.supplierName}`}>
                  <td data-label="Supplier">
                    <span className="ledger__primary">{offer.supplierName}</span>
                    <span className="ledger__sub">
                      {offer.inStock ? "In stock" : "Out of stock"}
                    </span>
                  </td>
                  <td data-label="List / unit" className="num">
                    {formatMoney(offer.listPriceMinor, offer.currency)}
                  </td>
                  <td data-label="Delivery" className="num">
                    {offer.deliveryDays}
                  </td>
                  <td data-label="Score" className="num">
                    {offer.reliabilityScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="border-t border-rule px-4 py-2.5 text-[12.5px] leading-relaxed text-ink-soft">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  );
}
