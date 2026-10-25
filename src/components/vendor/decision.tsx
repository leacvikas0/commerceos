import {
  vendorAcceptAction,
  vendorCounterAction,
  vendorRejectAction,
} from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { VendorOffer } from "@/components/types";

/** Right module of the review desk: the three decisions, unchanged actions. */
export function Decision({ offer }: { offer: VendorOffer }) {
  const currency = offer.listing.currency;
  const symbol = currency === "USD" ? "$" : currency;
  const floor = offer.listing.floorPriceMinor;
  const suggested = Math.round((offer.unitPriceMinor + floor) / 2);

  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Decision</h2>
        <span className="module__meta">Supplier policy</span>
      </div>

      <div className="module__body">
        <div className="decision">
          <form action={vendorAcceptAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="btn btn--primary btn--block">
              Accept at {formatMoney(offer.unitPriceMinor, currency)}
            </button>
          </form>

          <form action={vendorRejectAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <button type="submit" className="btn btn--secondary btn--block">
              Reject
            </button>
          </form>

          <div>
            <p className="decision__counter-label">Counter</p>
            <form action={vendorCounterAction} className="counter-row">
              <input type="hidden" name="offerId" value={offer.id} />
              <div className="affix">
                <span className="affix__prefix" aria-hidden="true">
                  {symbol}
                </span>
                <input
                  name="counterPrice"
                  className="input"
                  inputMode="decimal"
                  defaultValue={(suggested / 100).toFixed(2)}
                  aria-label="Counter price"
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary">
                Send
              </button>
            </form>
            <p className="counter-note">
              Floor {formatMoney(floor, currency)} — a counter below it is
              refused.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
