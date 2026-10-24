import Link from "next/link";
import {
  authorizeOrderAction,
  confirmOrderAction,
} from "@/app/actions";
import { formatMoney } from "@/lib/format";
import { StatusStamp } from "@/components/ui";
import { negotiationStatus, orderStatus } from "@/components/status";
import type { NegotiationDetail } from "@/components/types";

/**
 * The order gate: authorize the agreed deal, then confirm it. Confirming
 * re-checks live listing terms, so a repriced listing blocks instead of
 * confirming silently.
 */
export function OrderGate({
  detail,
  currency,
}: {
  detail: NegotiationDetail;
  currency: string;
}) {
  const order = detail.order;
  const status = orderStatus(order) ?? negotiationStatus(detail.status);

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Order</h2>
        <StatusStamp status={status} />
      </div>
      <div className="card__body">
        {order ? (
          <div className="mb-3 divide-y divide-rule">
            <div className="flex items-baseline justify-between gap-3 pb-2">
              <span className="text-[12px] text-ink-faint">Total</span>
              <span className="mono num text-[15px] font-semibold">
                {formatMoney(order.totalMinor, order.currency)}
              </span>
            </div>
            <p className="pt-2 text-[12px] text-ink-faint">
              {order.quantity} units at{" "}
              <span className="mono text-ink">
                {formatMoney(order.agreedUnitPriceMinor, order.currency)}
              </span>{" "}
              per unit
            </p>
          </div>
        ) : null}

        {!order ? (
          detail.status === "REJECTED" ? (
            <div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                No supplier accepted a price inside the budget. Nothing was
                ordered.
              </p>
              <Link href="/" className="btn btn--outline mt-3">
                New requisition
              </Link>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Waiting on the vendor desk. The order opens for authorization
              once a supplier accepts.
            </p>
          )
        ) : order.status === "AWAITING_AUTHORIZATION" ? (
          <div>
            {order.authorizedAt ? (
              <>
                <form action={confirmOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="hidden"
                    name="negotiationId"
                    value={detail.id}
                  />
                  <button type="submit" className="btn btn--primary btn--block">
                    Confirm order
                  </button>
                </form>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                  Confirming re-checks the live listing terms. If they changed
                  since authorization, the order blocks instead of confirming.
                </p>
              </>
            ) : (
              <>
                <form action={authorizeOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="hidden"
                    name="negotiationId"
                    value={detail.id}
                  />
                  <button type="submit" className="btn btn--primary btn--block">
                    Authorize purchase
                  </button>
                </form>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
                  Authorization records your approval. Confirmation is a
                  separate step against live terms.
                </p>
              </>
            )}
          </div>
        ) : order.status === "CONFIRMED" ? (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Confirmed at{" "}
            <span className="mono text-ink">
              {formatMoney(order.totalMinor, order.currency)}
            </span>
            . The purchase is complete in this demo.
          </p>
        ) : order.status === "BLOCKED" ? (
          <div>
            <p className="text-[13px] font-medium text-ink">
              Confirmation blocked
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
              The listing terms changed between authorization and confirmation.
            </p>
            {order.blockReason ? (
              <ul className="mt-2 space-y-1 border-l-2 border-[#fecaca] pl-3">
                {order.blockReason.split("; ").map((line) => (
                  <li key={line} className="text-[12px] leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/"
              className="btn btn--outline mt-3"
            >
              Raise a new requisition
            </Link>
          </div>
        ) : order.status === "CANCELLED" ? (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            This order was cancelled.
          </p>
        ) : null}

        {order && order.status === "AWAITING_AUTHORIZATION" ? (
          <p className="mt-3 border-t border-rule pt-2 text-[11.5px] text-ink-faint">
            Order total {formatMoney(order.totalMinor, order.currency)} ·{" "}
            {currency}
          </p>
        ) : null}
      </div>
    </section>
  );
}
