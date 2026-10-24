/**
 * Deterministic negotiation primitives.
 *
 * No database, no LLM, no randomness: every function is a pure mapping from
 * inputs to an integer price or a decision string, so the same inputs always
 * produce the same negotiation outcome. Money is integer minor units.
 */

export type OfferDecision = "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";

export type NegotiationStatus =
  | "OPEN"
  | "AWAITING_VENDOR"
  | "AGREED"
  | "REJECTED";

/** The buyer agent may raise its offer at most this many times. */
export const MAX_BUYER_ROUNDS = 3;

/** Each counter closes this share of the gap to the supplier's list price. */
const COUNTER_GAP_SHARE = 0.5;

export interface DecisionBands {
  autoAcceptFloorMinor: number;
  autoRejectBelowMinor: number;
}

/**
 * Supplier agent policy:
 *   offer >= autoAcceptFloorMinor  -> ACCEPTED (no human needed)
 *   offer <  autoRejectBelowMinor  -> REJECTED (no human needed)
 *   otherwise                      -> PENDING  (borderline, vendor decides)
 */
export function decideOffer(
  offerMinor: number,
  bands: DecisionBands,
): "ACCEPTED" | "REJECTED" | "PENDING" {
  if (offerMinor >= bands.autoAcceptFloorMinor) return "ACCEPTED";
  if (offerMinor < bands.autoRejectBelowMinor) return "REJECTED";
  return "PENDING";
}

/** Total budget converted to a per-unit ceiling, rounded down. */
export function budgetUnitCapMinor(
  budgetCapMinor: number,
  quantity: number,
): number {
  if (quantity <= 0) throw new Error("quantity must be positive");
  return Math.floor(budgetCapMinor / quantity);
}

export interface InitialOfferInput {
  targetUnitPriceMinor: number;
  floorPriceMinor: number;
  budgetCapMinor: number;
  quantity: number;
}

/**
 * The buyer agent's opening offer: its target, but never below the supplier's
 * floor and never above what the total budget allows per unit.
 */
export function initialBuyerOfferMinor(input: InitialOfferInput): number {
  const cap = budgetUnitCapMinor(input.budgetCapMinor, input.quantity);
  return Math.min(
    Math.max(input.targetUnitPriceMinor, input.floorPriceMinor),
    cap,
  );
}

export interface CounterOfferInput {
  currentOfferMinor: number;
  listPriceMinor: number;
  budgetCapMinor: number;
  quantity: number;
}

/**
 * Buyer counter: close half the remaining gap to the list price, clamped to
 * the per-unit budget cap. Never counters downward.
 */
export function counterOfferMinor(input: CounterOfferInput): number {
  const cap = budgetUnitCapMinor(input.budgetCapMinor, input.quantity);
  const gap = Math.max(0, input.listPriceMinor - input.currentOfferMinor);
  const raised = input.currentOfferMinor + Math.round(gap * COUNTER_GAP_SHARE);
  // Clamp to budget, but a counter must never move the price down.
  return Math.max(input.currentOfferMinor, Math.min(raised, cap));
}

/** Aggregate a round of supplier decisions into the negotiation status. */
export function statusFromDecisions(
  decisions: Array<"ACCEPTED" | "REJECTED" | "PENDING">,
): NegotiationStatus {
  if (decisions.some((decision) => decision === "ACCEPTED")) return "AGREED";
  if (decisions.some((decision) => decision === "PENDING")) {
    return "AWAITING_VENDOR";
  }
  return "REJECTED";
}

export interface DealCandidate {
  offerId: string;
  unitPriceMinor: number;
  deliveryDays: number;
  reliabilityScore: number;
}

/**
 * Recommended deal: lowest accepted unit price, then earliest delivery, then
 * the more reliable supplier. Deterministic final tie-break on offer id.
 */
export function recommendDeal(
  candidates: DealCandidate[],
): DealCandidate | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) =>
      a.unitPriceMinor - b.unitPriceMinor ||
      a.deliveryDays - b.deliveryDays ||
      b.reliabilityScore - a.reliabilityScore ||
      a.offerId.localeCompare(b.offerId),
  )[0];
}
