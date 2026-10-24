import { buyerAcceptCounterAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";

/** Banner above the rounds matrix when the vendor has countered. */
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
    <div className="card mt-4 border-[#fde68a] bg-[#fffbeb]">
      <div className="card__body flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#92400e]">
            Vendor counter-offer
          </p>
          <p className="mt-0.5 text-[12px] text-ink-soft">
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
    </div>
  );
}
