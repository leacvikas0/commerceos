import { formatMoney } from "@/lib/format";
import { Leader } from "@/components/ui";
import type { NegotiationOffer, NegotiationRound } from "@/components/types";

/** The accepted offer the engine would pick, surfaced for the buyer. */
export function RecommendedPanel({
  offer,
  round,
  targetUnitPriceMinor,
  quantity,
}: {
  offer: NegotiationOffer;
  round: NegotiationRound;
  targetUnitPriceMinor: number;
  quantity: number;
}) {
  const diff = offer.unitPriceMinor - targetUnitPriceMinor;
  const total = offer.unitPriceMinor * quantity;

  return (
    <div className="panel edge edge--olive">
      <div className="panel__head">
        <h2 className="eyebrow">Recommended deal</h2>
        <span className="eyebrow tone-olive">Accepted</span>
      </div>
      <div className="panel__body">
        <p className="font-display text-[1.3rem] leading-tight">
          {round.supplierName}
        </p>
        <p className="price mt-2 text-[22px]">
          {formatMoney(offer.unitPriceMinor, round.currency)}
          <span className="ml-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-faint">
            / unit
          </span>
        </p>
        <p className="mt-1 font-mono text-[0.72rem] text-ink-soft">
          {quantity} × {formatMoney(offer.unitPriceMinor, round.currency)} ={" "}
          {formatMoney(total, round.currency)}
        </p>
        <div className="mt-4 flex flex-col gap-2 border-t border-rule pt-3">
          <Leader label="Delivery">{round.deliveryDays} days</Leader>
          <Leader label="Reliability">
            {round.reliabilityScore} / 100
          </Leader>
          <Leader
            label="Against target"
            tone={diff > 0 ? "oxblood" : diff < 0 ? "olive" : undefined}
          >
            {diff === 0
              ? "At target"
              : `${diff > 0 ? "+" : "−"}${formatMoney(
                  Math.abs(diff),
                  round.currency,
                )} / unit`}
          </Leader>
        </div>
        <p className="mt-3 text-[0.7rem] leading-relaxed text-ink-faint">
          Lowest accepted price, then earliest delivery, then the more reliable
          supplier.
        </p>
      </div>
    </div>
  );
}
