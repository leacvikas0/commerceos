import type { NegotiationDetail } from "./types";

export type Tone = "waiting" | "blocked" | "confirmed" | "neutral";

export type StatusDescriptor = {
  label: string;
  tone: Tone;
};

/** The only order facts status language needs, so any order read model fits. */
export type StatusOrder = { status: string; authorizedAt: Date | null } | null;

/**
 * Status language used across the desk. Buyer-facing wording never implies a
 * supplier threshold — only "policy", "review" or a named state.
 */
export function negotiationStatus(status: string): StatusDescriptor {
  switch (status) {
    case "OPEN":
      return { label: "Open", tone: "neutral" };
    case "AWAITING_VENDOR":
      return { label: "Awaiting vendor", tone: "waiting" };
    case "AGREED":
      return { label: "Agreed — awaiting authorization", tone: "waiting" };
    case "REJECTED":
      return { label: "No deal", tone: "blocked" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function orderStatus(order: StatusOrder): StatusDescriptor | null {
  if (!order) return null;
  switch (order.status) {
    case "AWAITING_AUTHORIZATION":
      return order.authorizedAt
        ? { label: "Authorized — awaiting confirmation", tone: "waiting" }
        : { label: "Agreed — awaiting authorization", tone: "waiting" };
    case "CONFIRMED":
      return { label: "Confirmed", tone: "confirmed" };
    case "BLOCKED":
      return { label: "Blocked — terms changed", tone: "blocked" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "neutral" };
    default:
      return { label: order.status, tone: "neutral" };
  }
}

/** The single status a ledger row should show for a negotiation. */
export function headlineStatus(
  negotiation: Pick<NegotiationDetail, "status"> & {
    order: StatusOrder;
  },
): StatusDescriptor {
  return orderStatus(negotiation.order) ?? negotiationStatus(negotiation.status);
}

export function offerDecision(decision: string): StatusDescriptor {
  switch (decision) {
    case "ACCEPTED":
      return { label: "Accepted", tone: "confirmed" };
    case "REJECTED":
      return { label: "Declined", tone: "blocked" };
    case "PENDING":
      return { label: "Pending", tone: "waiting" };
    case "COUNTERED":
      return { label: "Countered", tone: "neutral" };
    default:
      return { label: decision, tone: "neutral" };
  }
}

/** True when a pending offer was authored by the vendor, not the buyer agent. */
export function isVendorCounter(note: string | null): boolean {
  return Boolean(note?.startsWith("Vendor counter at"));
}

/**
 * Buyer-facing note. Raw engine notes mention supplier policy bands, so the
 * buyer transcript restates them in desk language without threshold values.
 */
export function buyerOfferNote(
  decision: string,
  note: string | null,
  round: number,
): string {
  switch (decision) {
    case "ACCEPTED":
      return note?.includes("Vendor accepted")
        ? "Vendor accepted this price at the desk."
        : "Supplier policy accepted this price automatically.";
    case "REJECTED":
      return note?.includes("Superseded")
        ? "Superseded — another offer was accepted for this negotiation."
        : "Supplier policy declined this price automatically.";
    case "COUNTERED":
      return "Vendor declined and countered.";
    case "PENDING":
      if (isVendorCounter(note)) return "Vendor counter-offer — awaiting your decision.";
      if (round === 1) return "Inside the supplier's review band — sent to the vendor desk.";
      return "Buyer counter sent — awaiting the vendor's decision.";
    default:
      return "";
  }
}
