import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { VendorOffer } from "@/components/types";

function age(date: Date, now: number): string {
  const minutes = Math.max(
    0,
    Math.floor((now - date.getTime()) / (60 * 1000)),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Left pane of the vendor desk: pending offers, selected one highlighted. */
export function PendingList({
  offers,
  selectedId,
  now,
}: {
  offers: VendorOffer[];
  selectedId: string | null;
  now: number;
}) {
  return (
    <div className="queue__list">
      {offers.map((offer) => {
        const active = offer.id === selectedId;
        return (
          <Link
            key={offer.id}
            href={`/vendor?offer=${offer.id}`}
            className={`offer-row${active ? " offer-row--active" : ""}`}
            aria-current={active ? "true" : undefined}
          >
            <div className="offer-row__top">
              <span className="offer-row__item">
                {offer.negotiation.item.name}
              </span>
              <span className="offer-row__price">
                {formatMoney(offer.unitPriceMinor, offer.listing.currency)}
              </span>
            </div>
            <p className="offer-row__meta">
              {offer.listing.supplier.name} · floor{" "}
              {formatMoney(
                offer.listing.floorPriceMinor,
                offer.listing.currency,
              )}
            </p>
            <p className="offer-row__meta">
              {offer.negotiation.buyer.name} · {age(offer.createdAt, now)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
