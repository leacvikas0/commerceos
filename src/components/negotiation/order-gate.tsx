import {
  authorizeOrderAction,
  confirmOrderAction,
} from "@/app/actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusWord } from "@/components/ui";
import { negotiationStatus, orderStatus } from "@/components/status";
import type { NegotiationDetail } from "@/components/types";

type StepState = "complete" | "next" | "locked" | "failed";

type Step = {
  title: string;
  sub: string;
  state: StepState;
  stateLabel: string;
};

/**
 * The order gate: authorize the agreed deal, then confirm it against live
 * listing terms. Timestamps are shown only where the database actually has
 * one (order created, authorized) — confirmation is not invented.
 */
export function OrderGate({ detail }: { detail: NegotiationDetail }) {
  const order = detail.order;
  const status = orderStatus(order) ?? negotiationStatus(detail.status);

  const steps: Step[] = [];
  let action: "authorize" | "confirm" | "blocked" | null = null;
  let note: string;

  if (!order) {
    if (detail.status === "REJECTED") {
      steps.push({
        title: "Agreed",
        sub: "No supplier accepted a price inside the budget.",
        state: "failed",
        stateLabel: "No deal",
      });
      note = "Nothing was ordered. Raise a new requisition to try again.";
    } else {
      steps.push({
        title: "Agreed",
        sub: "Waiting on the vendor desk for an accepted price.",
        state: "next",
        stateLabel: "Pending",
      });
      note =
        "The order opens for authorization once a supplier accepts an offer.";
    }
    steps.push({
      title: "Authorize",
      sub: "Opens once a price is agreed.",
      state: "locked",
      stateLabel: "Locked",
    });
    steps.push({
      title: "Confirm",
      sub: "Re-checks the live listing terms.",
      state: "locked",
      stateLabel: "Locked",
    });
  } else if (order.status === "AWAITING_AUTHORIZATION") {
    steps.push({
      title: "Agreed",
      sub: `Recorded ${formatDateTime(order.createdAt)}`,
      state: "complete",
      stateLabel: "Complete",
    });

    if (order.authorizedAt) {
      steps.push({
        title: "Authorize",
        sub: `Authorized ${formatDateTime(order.authorizedAt)}`,
        state: "complete",
        stateLabel: "Complete",
      });
      steps.push({
        title: "Confirm",
        sub: "Re-checks the live listing terms before committing.",
        state: "next",
        stateLabel: "Next",
      });
      action = "confirm";
      note =
        "Confirming re-checks the live listing terms. If they changed since authorization, the order blocks instead.";
    } else {
      steps.push({
        title: "Authorize",
        sub: "Send the purchase order to the supplier.",
        state: "next",
        stateLabel: "Next",
      });
      steps.push({
        title: "Confirm",
        sub: "Re-checks the live listing terms.",
        state: "locked",
        stateLabel: "Locked",
      });
      action = "authorize";
      note = "No payment is processed in this demo.";
    }
  } else if (order.status === "CONFIRMED") {
    steps.push({
      title: "Agreed",
      sub: `Recorded ${formatDateTime(order.createdAt)}`,
      state: "complete",
      stateLabel: "Complete",
    });
    steps.push({
      title: "Authorize",
      sub: order.authorizedAt
        ? `Authorized ${formatDateTime(order.authorizedAt)}`
        : "Authorized.",
      state: "complete",
      stateLabel: "Complete",
    });
    steps.push({
      title: "Confirm",
      sub: "Confirmed against the live listing terms.",
      state: "complete",
      stateLabel: "Complete",
    });
    note = `Confirmed at ${formatMoney(
      order.totalMinor,
      order.currency,
    )}. The purchase is complete in this demo.`;
  } else if (order.status === "BLOCKED") {
    steps.push({
      title: "Agreed",
      sub: `Recorded ${formatDateTime(order.createdAt)}`,
      state: "complete",
      stateLabel: "Complete",
    });
    steps.push({
      title: "Authorize",
      sub: order.authorizedAt
        ? `Authorized ${formatDateTime(order.authorizedAt)}`
        : "Authorized.",
      state: "complete",
      stateLabel: "Complete",
    });
    steps.push({
      title: "Confirm",
      sub: "Confirmation failed — the listing terms changed.",
      state: "failed",
      stateLabel: "Blocked",
    });
    action = "blocked";
    note = "The order was not confirmed. Nothing was charged.";
  } else {
    steps.push({
      title: "Agreed",
      sub: "This order was cancelled.",
      state: "locked",
      stateLabel: "Closed",
    });
    steps.push({
      title: "Authorize",
      sub: "Not applicable.",
      state: "locked",
      stateLabel: "Locked",
    });
    steps.push({
      title: "Confirm",
      sub: "Not applicable.",
      state: "locked",
      stateLabel: "Locked",
    });
    note = "This order was cancelled.";
  }

  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Order</h2>
        <StatusWord status={status} small />
      </div>

      <div className="module__body">
        <div className="steps">
          {steps.map((step, index) => (
            <div key={step.title} className={`step step--${step.state}`}>
              <span className="step__num">{index + 1}</span>
              <div>
                <p className="step__title">{step.title}</p>
                <p className="step__sub">{step.sub}</p>
              </div>
              <span className="step__state">{step.stateLabel}</span>
            </div>
          ))}
        </div>

        {action === "authorize" ? (
          <form action={authorizeOrderAction} className="order-action">
            <input type="hidden" name="orderId" value={order?.id} />
            <input type="hidden" name="negotiationId" value={detail.id} />
            <button type="submit" className="btn btn--primary btn--block">
              Authorize order
            </button>
          </form>
        ) : null}

        {action === "confirm" ? (
          <form action={confirmOrderAction} className="order-action">
            <input type="hidden" name="orderId" value={order?.id} />
            <input type="hidden" name="negotiationId" value={detail.id} />
            <button type="submit" className="btn btn--primary btn--block">
              Confirm order
            </button>
          </form>
        ) : null}

        {action === "blocked" ? (
          <div className="order-action">
            <button
              type="button"
              disabled
              className="btn btn--block btn--disabled"
            >
              Confirm order
            </button>
          </div>
        ) : null}

        <p className="order-note">{note}</p>
      </div>
    </section>
  );
}
