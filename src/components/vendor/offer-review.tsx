import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { Band } from "./band";
import type { VendorOffer } from "@/components/types";

/** Middle module of the review desk: the offer against the supplier's window. */
export function OfferReview({ offer }: { offer: VendorOffer }) {
  const listing = offer.listing;
  const currency = listing.currency;
  const quantity = offer.negotiation.quantity;

  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Offer review</h2>
        <span className="module__meta">{offer.negotiation.item.sku}</span>
      </div>

      <div className="module__body">
        <p className="offer-review__supplier">{listing.supplier.name}</p>

        <div className="offer-price">
          <span className="offer-price__value">
            {formatMoney(offer.unitPriceMinor, currency)}
          </span>
          <span className="offer-price__unit">/unit</span>
        </div>

        <p className="offer-total">
          {quantity} units ·{" "}
          {formatMoney(offer.unitPriceMinor * quantity, currency)} total
        </p>

        <Band
          offered={offer.unitPriceMinor}
          floor={listing.floorPriceMinor}
          reject={listing.autoRejectBelowMinor}
          accept={listing.autoAcceptFloorMinor}
          list={listing.listPriceMinor}
          currency={currency}
        />

        <div className="facts">
          <div className="fact">
            <span className="fact__label">Quantity</span>
            <span className="fact__value num">{quantity}</span>
          </div>
          <div className="fact">
            <span className="fact__label">Buyer</span>
            <span className="fact__value">
              {offer.negotiation.buyer.name}
            </span>
          </div>
          <div className="fact">
            <span className="fact__label">Delivery</span>
            <span className="fact__value">{listing.deliveryDays} days</span>
          </div>
          <div className="fact">
            <span className="fact__label">Reliability</span>
            <span className="fact__value num">
              {listing.supplier.reliabilityScore}/100
            </span>
          </div>
          <div className="fact">
            <span className="fact__label">Deadline</span>
            <span className="fact__value">
              {formatDate(offer.negotiation.deadline)}
            </span>
          </div>
          <div className="fact">
            <span className="fact__label">Filed</span>
            <span className="fact__value">
              {formatDateTime(offer.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
