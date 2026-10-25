import { buyerAcceptCounterAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";

/** Banner above the modules when the vendor has countered. */
export function CounterBanner({
  negotiationId,
  offerId,
  unitPriceMinor,
  quantity,
  currency,
}: {
  negotiationId: string;
  offerId: string;
  unitPriceMinor: number;
  quantity: number;
  currency: string;
}) {
  return (
    <div className="counter-banner">
      <div>
        <p className="counter-banner__title">
          <span className="tab__dot tab__dot--waiting" aria-hidden="true" />
          Vendor counter-offer
        </p>
        <p className="counter-banner__text">
          {formatMoney(unitPriceMinor, currency)} per unit ·{" "}
          {formatMoney(unitPriceMinor * quantity, currency)} total. Accepting
          closes the deal at this price.
        </p>
      </div>

      <form action={buyerAcceptCounterAction}>
        <input type="hidden" name="offerId" value={offerId} />
        <input type="hidden" name="negotiationId" value={negotiationId} />
        <button type="submit" className="btn btn--primary">
          Accept counter
        </button>
      </form>
    </div>
  );
}
