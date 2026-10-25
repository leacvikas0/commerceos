import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { EmptyNote } from "@/components/ui";
import { BandLegend } from "./legend";
import type { VendorOffer } from "@/components/types";

/** Left module of the review desk: pending offers, selected one marked. */
export function Queue({
  offers,
  selectedId,
}: {
  offers: VendorOffer[];
  selectedId: string | null;
}) {
  return (
    <section className="module">
      <div className="module__head module__head--stack">
        <div className="module__head-row">
          <h2 className="module__label">Queue</h2>
          <span className="module__meta">
            {offers.length === 0 ? "Clear" : `${offers.length} open`}
          </span>
        </div>
        <BandLegend />
      </div>

      {offers.length === 0 ? (
        <EmptyNote>Nothing in the review band right now.</EmptyNote>
      ) : (
        <div>
          {offers.map((offer) => {
            const active = offer.id === selectedId;
            return (
              <Link
                key={offer.id}
                href={`/vendor?offer=${offer.id}`}
                className={`queue-row${active ? " queue-row--active" : ""}`}
                aria-current={active ? "true" : undefined}
              >
                <span className="queue-row__main">
                  <span className="queue-row__item">
                    {offer.negotiation.item.name}
                  </span>
                  <span className="queue-row__meta">
                    {offer.listing.supplier.name} · floor{" "}
                    {formatMoney(
                      offer.listing.floorPriceMinor,
                      offer.listing.currency,
                    )}
                  </span>
                </span>
                <span className="queue-row__right">
                  <span className="queue-row__price">
                    {formatMoney(offer.unitPriceMinor, offer.listing.currency)}
                  </span>
                  <span className="queue-row__dot" />
                </span>
              </Link>
            );
          })}
          <p className="module__foot">
            Countered offers return to the buyer for a decision.
          </p>
        </div>
      )}
    </section>
  );
}
