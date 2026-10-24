import {
  vendorAcceptAction,
  vendorCounterAction,
  vendorRejectAction,
} from "@/app/actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusStamp } from "@/components/ui";
import { offerDecision } from "@/components/status";
import type { VendorOffer } from "@/components/types";

/** Right pane of the vendor desk: the selected offer and its actions. */
export function OfferDetail({ offer }: { offer: VendorOffer }) {
  const currency = offer.listing.currency;
  const list = offer.listing.listPriceMinor;
  const floor = offer.listing.floorPriceMinor;
  const offered = offer.unitPriceMinor;
  const quantity = offer.negotiation.quantity;
  const suggested = Math.round((offered + floor) / 2);

  const width = (value: number) =>
    `${Math.min(100, Math.max(2, Math.round((value / Math.max(1, list)) * 100)))}%`;

  const bars = [
    { label: "Offered", value: offered, cls: "" },
    { label: "Floor", value: floor, cls: " bar-row__fill--floor" },
    { label: "List", value: list, cls: " bar-row__fill--list" },
  ];

  return (
    <section className="card offer-detail">
      <div className="card__head">
        <div className="min-w-0">
          <h2 className="card__title">{offer.negotiation.item.name}</h2>
          <p className="card__sub">
            {offer.listing.supplier.name} · {offer.negotiation.item.sku}
          </p>
        </div>
        <StatusStamp status={offerDecision(offer.decision)} />
      </div>

      <div className="card__body">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-faint">
          Offered unit price
        </p>
        <p className="offer-detail__price mt-1">
          {formatMoney(offered, currency)}
        </p>
        <p className="mt-1 text-[12px] text-ink-faint">
          {quantity} units · {formatMoney(offered * quantity, currency)} total
        </p>

        <div className="bars">
          {bars.map((bar) => (
            <div key={bar.label} className="bar-row">
              <span className="bar-row__label">{bar.label}</span>
              <span className="bar-row__track">
                <span
                  className={`bar-row__fill${bar.cls}`}
                  style={{ width: width(bar.value) }}
                />
              </span>
              <span className="bar-row__value">
                {formatMoney(bar.value, currency)}
              </span>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-rule pt-3">
          <div>
            <dt className="text-[11.5px] text-ink-faint">Quantity</dt>
            <dd className="num text-[12.5px]">{quantity}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-faint">Buyer</dt>
            <dd className="text-[12.5px]">
              {offer.negotiation.buyer.name}
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-faint">Delivery</dt>
            <dd className="text-[12.5px]">
              {offer.listing.deliveryDays} days
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-faint">Reliability</dt>
            <dd className="num text-[12.5px]">
              {offer.listing.supplier.reliabilityScore} / 100
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-faint">Deadline</dt>
            <dd className="text-[12.5px]">
              {formatDateTime(offer.negotiation.deadline)}
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-faint">Filed</dt>
            <dd className="text-[12.5px]">
              {formatDateTime(offer.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          <form action={vendorAcceptAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="btn btn--primary">
              Accept
            </button>
          </form>
          <form action={vendorRejectAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="btn btn--danger">
              Reject
            </button>
          </form>
        </div>

        <form
          action={vendorCounterAction}
          className="mt-3 flex items-end gap-2"
        >
          <input type="hidden" name="offerId" value={offer.id} />
          <div className="field flex-1">
            <label htmlFor="counterPrice" className="field__label">
              Counter price
            </label>
            <input
              id="counterPrice"
              name="counterPrice"
              className="input"
              inputMode="decimal"
              defaultValue={(suggested / 100).toFixed(2)}
              required
            />
          </div>
          <button type="submit" className="btn btn--outline">
            Send counter
          </button>
        </form>
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
          A counter at or above the floor of {formatMoney(floor, currency)}{" "}
          keeps the deal open.
        </p>
      </div>
    </section>
  );
}
