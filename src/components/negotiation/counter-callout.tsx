import { buyerAcceptCounterAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { NegotiationOffer, NegotiationRound } from "@/components/types";

/** A vendor counter-offer awaiting the buyer's decision. */
export function CounterCallout({
  negotiationId,
  offer,
  round,
  quantity,
  targetUnitPriceMinor,
}: {
  negotiationId: string;
  offer: NegotiationOffer;
  round: NegotiationRound;
  quantity: number;
  targetUnitPriceMinor: number;
}) {
  const total = offer.unitPriceMinor * quantity;
  const diff = offer.unitPriceMinor - targetUnitPriceMinor;

  return (
    <section
      className="panel edge edge--ochre reveal mb-10"
      aria-labelledby="counter-heading"
    >
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="eyebrow tone-ochre">
            Vendor counter-offer · awaiting you
          </p>
          <h2
            id="counter-heading"
            className="mt-2 font-display text-[19px] leading-snug"
          >
            {round.supplierName} counters at{" "}
            {formatMoney(offer.unitPriceMinor, round.currency)} per unit.
          </h2>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">
            Round {offer.round} · {quantity} units ·{" "}
            {formatMoney(total, round.currency)} total ·{" "}
            {diff === 0
              ? "at your target"
              : `${diff > 0 ? "+" : "−"}${formatMoney(
                  Math.abs(diff),
                  round.currency,
                )} per unit against target`}
            . Accepting locks the price and opens the order for authorization.
          </p>
        </div>
        <form action={buyerAcceptCounterAction} className="sm:justify-self-end">
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="negotiationId" value={negotiationId} />
          <button type="submit" className="btn btn--ochre">
            Accept counter
          </button>
        </form>
      </div>
    </section>
  );
}
