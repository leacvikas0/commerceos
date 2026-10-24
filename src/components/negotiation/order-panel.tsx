import Link from "next/link";
import {
  authorizeOrderAction,
  confirmOrderAction,
} from "@/app/actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { negotiationStatus, orderStatus } from "@/components/status";
import { Leader, StatusStamp } from "@/components/ui";
import type {
  NegotiationDetail,
  NegotiationOffer,
  NegotiationRound,
} from "@/components/types";

/**
 * The order gate. Authorize records the buyer's approval; confirm re-reads the
 * live listing and blocks if any frozen term changed since the deal.
 */
export function OrderPanel({
  detail,
  recommended,
  currency,
}: {
  detail: NegotiationDetail;
  recommended: { offer: NegotiationOffer; round: NegotiationRound } | null;
  currency: string;
}) {
  const order = detail.order;
  const status = orderStatus(order) ?? negotiationStatus(detail.status);
  const unit =
    order?.agreedUnitPriceMinor ?? recommended?.offer.unitPriceMinor ?? null;
  const quantity = order?.quantity ?? detail.quantity;
  const total = order?.totalMinor ?? (unit !== null ? unit * quantity : null);
  const displayCurrency = order?.currency ?? currency;
  const supplier = recommended?.round.supplierName ?? null;
  const delivery = recommended?.round.deliveryDays ?? null;

  return (
    <section className="panel" aria-labelledby="order-heading">
      <div className="panel__head">
        <h2 id="order-heading" className="eyebrow">
          Order
        </h2>
        <StatusStamp status={status} />
      </div>

      <div className="panel__body">
        {total !== null ? (
          <>
            <p className="eyebrow eyebrow--faint">
              {order ? "Order total" : "Agreed total"}
            </p>
            <p className="price mt-1 text-[26px]">
              {formatMoney(total, displayCurrency)}
            </p>
            <p className="mt-1 font-mono text-[0.72rem] text-ink-soft">
              {quantity} × {formatMoney(unit ?? 0, displayCurrency)}
            </p>
          </>
        ) : null}

        {order ? (
          <div className="mt-4 flex flex-col gap-2">
            <Leader label="Supplier">{supplier ?? "Accepted offer"}</Leader>
            <Leader label="Unit price">
              {formatMoney(order.agreedUnitPriceMinor, displayCurrency)}
            </Leader>
            <Leader label="Quantity">{order.quantity} units</Leader>
            {delivery !== null ? (
              <Leader label="Delivery">{delivery} days</Leader>
            ) : null}
            {order.authorizedAt ? (
              <Leader label="Authorized">
                {formatDateTime(order.authorizedAt)}
              </Leader>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 border-t border-rule pt-4">
          {!order && detail.status === "AWAITING_VENDOR" ? (
            <>
              <p className="text-[0.82rem] leading-relaxed text-ink-soft">
                A borderline offer is on the vendor desk. This page updates when
                they accept, reject or counter.
              </p>
              <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ochre">
                Awaiting vendor
              </p>
            </>
          ) : null}

          {!order && detail.status === "REJECTED" ? (
            <>
              <p className="text-[0.82rem] leading-relaxed text-ink-soft">
                Every supplier declined and the buyer agent&apos;s counters did
                not clear the review band. Nothing was agreed.
              </p>
              <Link href="/" className="btn btn--ink btn--block mt-3">
                Start a new requisition
              </Link>
            </>
          ) : null}

          {!order &&
          detail.status !== "AWAITING_VENDOR" &&
          detail.status !== "REJECTED" ? (
            <p className="text-[0.82rem] leading-relaxed text-ink-soft">
              The negotiation is open. An agreed price will open an order here
              for authorization.
            </p>
          ) : null}

          {order?.status === "AWAITING_AUTHORIZATION" && !order.authorizedAt ? (
            <>
              <p className="text-[0.82rem] leading-relaxed text-ink-soft">
                Authorizing records your approval of these terms. Nothing is
                charged and no payment is taken.
              </p>
              <form action={authorizeOrderAction} className="mt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  type="hidden"
                  name="negotiationId"
                  value={detail.id}
                />
                <button type="submit" className="btn btn--ink btn--block">
                  Authorize order
                </button>
              </form>
            </>
          ) : null}

          {order?.status === "AWAITING_AUTHORIZATION" && order.authorizedAt ? (
            <>
              <p className="text-[0.82rem] leading-relaxed text-ink-soft">
                Authorized {formatDateTime(order.authorizedAt)}. Confirming
                re-reads the live listing — if the price, delivery, spec or terms
                changed since the deal, the order blocks instead of confirming.
              </p>
              <form action={confirmOrderAction} className="mt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input
                  type="hidden"
                  name="negotiationId"
                  value={detail.id}
                />
                <button type="submit" className="btn btn--olive btn--block">
                  Confirm order
                </button>
              </form>
            </>
          ) : null}

          {order?.status === "CONFIRMED" ? (
            <p className="text-[0.82rem] leading-relaxed text-ink-soft">
              The terms matched the listing and the order is confirmed. This is a
              demonstration desk: no invoice is raised and no money moves.
            </p>
          ) : null}

          {order?.status === "BLOCKED" ? (
            <>
              <p className="text-[0.82rem] leading-relaxed text-ink-soft">
                The supplier changed the listing after the deal was agreed. The
                order cannot be confirmed on the frozen terms.
              </p>
              {order.blockReason ? (
                <div className="mt-3 border border-oxblood/40 bg-bone px-3 py-2.5">
                  <p className="eyebrow tone-oxblood">Frozen vs live</p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {order.blockReason
                      .split("; ")
                      .filter(Boolean)
                      .map((change) => (
                        <li
                          key={change}
                          className="font-mono text-[0.7rem] leading-snug text-ink"
                        >
                          {change}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
              <Link href="/" className="btn btn--quiet mt-3">
                Start a new requisition
              </Link>
            </>
          ) : null}

          {order?.status === "CANCELLED" ? (
            <p className="text-[0.82rem] leading-relaxed text-ink-soft">
              This order was cancelled. Open a new negotiation to trade again.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
