import { simulateRepricingAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import { Caption, Leader } from "@/components/ui";
import type { VendorListing } from "@/components/types";

/**
 * Every listing with its price bands and terms version, plus the demo control
 * that changes the listing so the terms gate can be exercised.
 */
export function ListingsPanel({ listings }: { listings: VendorListing[] }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => (
          <article key={listing.id} className="panel panel--flush">
            <div className="flex items-start justify-between gap-3 border-b border-rule px-4 pt-3.5 pb-2.5">
              <div className="min-w-0">
                <h3 className="font-display text-[1.2rem] leading-tight">
                  {listing.supplier.name}
                </h3>
                <p className="mt-0.5 text-[0.78rem] text-ink-soft">
                  {listing.item.name}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-faint">
                {listing.termsVersion}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3.5 sm:grid-cols-2">
              <Leader label="List / unit">
                {formatMoney(listing.listPriceMinor, listing.currency)}
              </Leader>
              <Leader label="Floor">
                {formatMoney(listing.floorPriceMinor, listing.currency)}
              </Leader>
              <Leader label="Auto-accept ≥" tone="olive">
                {formatMoney(listing.autoAcceptFloorMinor, listing.currency)}
              </Leader>
              <Leader label="Auto-reject <" tone="oxblood">
                {formatMoney(listing.autoRejectBelowMinor, listing.currency)}
              </Leader>
              <Leader label="Delivery">{listing.deliveryDays} days</Leader>
              <Leader label="Stock">
                {listing.stock.toLocaleString("en-US")} units
              </Leader>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-2.5">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-ink-faint">
                Terms gate
              </span>
              <form action={simulateRepricingAction}>
                <input type="hidden" name="listingId" value={listing.id} />
                <button type="submit" className="btn btn--quiet">
                  Simulate repricing
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>

      <Caption>
        Simulate repricing raises the list price by 15% and revises the listing&apos;s
        terms version. Any order agreed on the old terms is blocked at
        confirmation — that is the terms gate, not a payment failure.
      </Caption>
    </>
  );
}
