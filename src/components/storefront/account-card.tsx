import { formatMoney } from "@/lib/format";
import { Leader } from "@/components/ui";
import type { Buyer } from "@/components/types";

/** Small account summary that sits in the buyer page's right column. */
export function AccountCard({
  buyer,
  activeListings,
  catalogueItems,
}: {
  buyer: Buyer;
  activeListings: number;
  catalogueItems: number;
}) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Account</h2>
        <span className="card__sub">On file</span>
      </div>
      <div className="card__body">
        <p className="text-[14px] font-medium">{buyer.name}</p>
        <div className="mt-2 divide-y divide-rule">
          <Leader
            label="Budget cap"
            value={formatMoney(buyer.budgetCapMinor, buyer.currency)}
            mono
          />
          <Leader label="Currency" value={buyer.currency} />
          <Leader label="Active listings" value={activeListings} />
          <Leader label="Catalogue items" value={catalogueItems} />
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
          The cap covers the whole purchase, not a unit price.
        </p>
      </div>
    </section>
  );
}
