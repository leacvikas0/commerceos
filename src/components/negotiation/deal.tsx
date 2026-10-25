import { formatDate, formatMoney } from "@/lib/format";

export type DealData = {
  totalMinor: number;
  unitMinor: number;
  quantity: number;
  supplierName: string;
  deliveryDays: number;
  currency: string;
  fromOrder: boolean;
};

/** Honest pre-deal facts shown while no price has been agreed. */
export type DealFallback = {
  targetUnitPriceMinor: number;
  budgetCapMinor: number;
  deadline: Date;
  supplierState: string;
  currency: string;
};

/** The agreed (or best) deal in the transcript's right rail. */
export function Deal({
  deal,
  fallback,
}: {
  deal: DealData | null;
  fallback: DealFallback;
}) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Deal</h2>
        <span className="module__meta">
          {deal ? (deal.fromOrder ? "Order on file" : "Provisional") : "Open"}
        </span>
      </div>

      <div className="module__body">
        {deal ? (
          <>
            <p className="deal__total">
              {formatMoney(deal.totalMinor, deal.currency)}
            </p>
            <p className="deal__qty">
              {deal.quantity} units ×{" "}
              {formatMoney(deal.unitMinor, deal.currency)}
            </p>

            <div className="facts facts--single">
              <div className="fact">
                <span className="fact__label">Supplier</span>
                <span className="fact__value">{deal.supplierName}</span>
              </div>
              <div className="fact">
                <span className="fact__label">Delivery</span>
                <span className="fact__value">{deal.deliveryDays} days</span>
              </div>
              <div className="fact">
                <span className="fact__label">Price lock</span>
                <span className="fact__value num">
                  {formatMoney(deal.unitMinor, deal.currency)} / unit
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="facts facts--single">
              <div className="fact">
                <span className="fact__label">Target / unit</span>
                <span className="fact__value num">
                  {formatMoney(
                    fallback.targetUnitPriceMinor,
                    fallback.currency,
                  )}
                </span>
              </div>
              <div className="fact">
                <span className="fact__label">Budget cap</span>
                <span className="fact__value num">
                  {formatMoney(fallback.budgetCapMinor, fallback.currency)}
                </span>
              </div>
              <div className="fact">
                <span className="fact__label">Deadline</span>
                <span className="fact__value">
                  {formatDate(fallback.deadline)}
                </span>
              </div>
              <div className="fact">
                <span className="fact__label">Supplier</span>
                <span className="fact__value">{fallback.supplierState}</span>
              </div>
            </div>
            <p className="deal__empty">
              No price agreed yet. The buying agent is still working the round.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
