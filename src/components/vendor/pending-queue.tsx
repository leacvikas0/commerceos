import {
  vendorAcceptAction,
  vendorCounterAction,
  vendorRejectAction,
} from "@/app/actions";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { EmptyNote, Leader, StatusStamp } from "@/components/ui";
import { offerDecision } from "@/components/status";
import type { VendorOffer } from "@/components/types";

/** The human review queue: borderline offers awaiting accept / reject / counter. */
export function PendingQueue({ offers }: { offers: VendorOffer[] }) {
  if (offers.length === 0) {
    return (
      <EmptyNote>
        Queue clear. Nothing is waiting on a human decision right now.
      </EmptyNote>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {offers.map((offer, index) => (
        <PendingCard key={offer.id} offer={offer} index={index} />
      ))}
    </div>
  );
}

function PendingCard({ offer, index }: { offer: VendorOffer; index: number }) {
  const { negotiation, listing } = offer;
  const currency = listing.currency;
  const total = offer.unitPriceMinor * negotiation.quantity;
  const suggested = Math.round(
    ((offer.unitPriceMinor + listing.listPriceMinor) / 2 / 10) * 10,
  );

  return (
    <article
      className="panel edge edge--ochre reveal"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="grid gap-6 p-5 lg:grid-cols-12 lg:gap-8 lg:p-6">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow eyebrow--faint">Borderline offer</p>
              <h3 className="mt-1.5 font-display text-[1.45rem] leading-tight">
                {negotiation.item.name}
              </h3>
              <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-faint">
                {negotiation.item.sku} · {listing.supplier.name}
              </p>
            </div>
            <StatusStamp status={offerDecision(offer.decision)} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            <Leader label="Quantity">{negotiation.quantity} units</Leader>
            <Leader label="Buyer">{negotiation.buyer.name}</Leader>
            <Leader label="Supplier floor" tone="ochre">
              {formatMoney(listing.floorPriceMinor, currency)}
            </Leader>
            <Leader label="List / unit">
              {formatMoney(listing.listPriceMinor, currency)}
            </Leader>
            <Leader label="Delivery">{listing.deliveryDays} days</Leader>
            <Leader label="Reliability">
              {listing.supplier.reliabilityScore} / 100
            </Leader>
            <Leader label="Filed">{formatDateTime(offer.createdAt)}</Leader>
            <Leader label="Deadline">{formatDate(negotiation.deadline)}</Leader>
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-rule lg:pl-8">
          <p className="eyebrow eyebrow--faint">Offered unit price</p>
          <p className="price mt-1.5 text-[26px]">
            {formatMoney(offer.unitPriceMinor, currency)}
          </p>
          <p className="mt-1 font-mono text-[0.72rem] text-ink-soft">
            {negotiation.quantity} × {formatMoney(offer.unitPriceMinor, currency)}{" "}
            = {formatMoney(total, currency)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <form action={vendorAcceptAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button type="submit" className="btn btn--olive">
                Accept
              </button>
            </form>
            <form action={vendorRejectAction}>
              <input type="hidden" name="offerId" value={offer.id} />
              <button type="submit" className="btn btn--oxblood">
                Reject
              </button>
            </form>
          </div>

          <form
            action={vendorCounterAction}
            className="mt-5 border-t border-rule pt-4"
          >
            <input type="hidden" name="offerId" value={offer.id} />
            <div className="flex items-end gap-2">
              <div className="field flex-1">
                <label
                  htmlFor={`counter-${offer.id}`}
                  className="field__label"
                >
                  Counter price / unit
                </label>
                <input
                  id={`counter-${offer.id}`}
                  name="counterPrice"
                  inputMode="decimal"
                  placeholder={(suggested / 100).toFixed(2)}
                  required
                  aria-describedby={`counter-hint-${offer.id}`}
                />
              </div>
              <button type="submit" className="btn btn--ochre">
                Counter
              </button>
            </div>
            <p
              id={`counter-hint-${offer.id}`}
              className="field__hint mt-2"
            >
              At or above the supplier floor of{" "}
              {formatMoney(listing.floorPriceMinor, currency)}. A counter closes
              this offer and sends a new price to the buyer.
            </p>
          </form>
        </div>
      </div>
    </article>
  );
}
