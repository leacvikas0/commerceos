import { formatMoney } from "@/lib/format";
import { Leader } from "@/components/ui";
import type { NegotiationDetail } from "@/components/types";

/** The agreed (or best) deal, in the transcript's right rail. */
export function DealCard({
  detail,
  currency,
  recommended,
}: {
  detail: NegotiationDetail;
  currency: string;
  recommended: {
    offer: { unitPriceMinor: number };
    round: { supplierName: string; deliveryDays: number; reliabilityScore: number };
  } | null;
}) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Deal</h2>
        {detail.order ? (
          <span className="card__sub">Order on file</span>
        ) : (
          <span className="card__sub">Provisional</span>
        )}
      </div>
      <div className="card__body">
        {recommended ? (
          <>
            <p className="price-xl">
              {formatMoney(recommended.offer.unitPriceMinor, currency)}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              per unit · {recommended.round.supplierName}
            </p>
            <div className="mt-3 divide-y divide-rule">
              <Leader
                label="Quantity"
                value={`${detail.quantity} units`}
                mono
              />
              <Leader
                label="Total"
                value={formatMoney(
                  detail.order?.totalMinor ??
                    recommended.offer.unitPriceMinor * detail.quantity,
                  currency,
                )}
                mono
              />
              <Leader
                label="Delivery"
                value={`${recommended.round.deliveryDays} days`}
              />
              <Leader
                label="Reliability"
                value={`${recommended.round.reliabilityScore} / 100`}
                mono
              />
            </div>
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            No agreed price yet. The buying agent is still working the round.
          </p>
        )}
      </div>
    </section>
  );
}
