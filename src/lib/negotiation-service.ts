import { prisma } from "./db";
import {
  MAX_BUYER_ROUNDS,
  counterOfferMinor,
  decideOffer,
  initialBuyerOfferMinor,
  recommendDeal,
  statusFromDecisions,
  type OfferDecision,
} from "./negotiation";
import { formatMoney } from "./format";

/**
 * Server-side orchestration of the deterministic negotiation engine.
 * The pricing/decision rules live in negotiation.ts; this file only persists
 * rounds, rolls statuses forward and creates the order once a deal is agreed.
 */

function decisionNote(
  decision: "ACCEPTED" | "REJECTED" | "PENDING",
  phase: string,
): string {
  if (decision === "ACCEPTED") return `Auto-accepted (${phase}): at or above the auto-accept floor.`;
  if (decision === "REJECTED") return `Auto-rejected (${phase}): below the auto-reject threshold.`;
  return `Borderline (${phase}): inside the review band, sent to the vendor.`;
}

/** Run every deterministic round for a negotiation, then roll up its status. */
export async function runNegotiation(negotiationId: string): Promise<void> {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      item: {
        include: {
          listings: {
            where: { active: true },
            include: { supplier: true },
            orderBy: { listPriceMinor: "asc" },
          },
        },
      },
    },
  });
  if (!negotiation) throw new Error("Negotiation not found");

  const listings = negotiation.item.listings;
  if (listings.length === 0) {
    await prisma.negotiation.update({
      where: { id: negotiationId },
      data: { status: "REJECTED" },
    });
    return;
  }

  // Round 1 — the buyer agent opens on every active listing.
  for (const listing of listings) {
    const unitPriceMinor = initialBuyerOfferMinor({
      targetUnitPriceMinor: negotiation.targetUnitPriceMinor,
      floorPriceMinor: listing.floorPriceMinor,
      budgetCapMinor: negotiation.budgetCapMinor,
      quantity: negotiation.quantity,
    });
    const decision = decideOffer(unitPriceMinor, listing);
    await prisma.offer.create({
      data: {
        negotiationId,
        listingId: listing.id,
        round: 1,
        unitPriceMinor,
        decision,
        note: decisionNote(decision, "opening offer"),
      },
    });
  }

  // Later rounds — the buyer agent counters offers that were rejected.
  for (let round = 2; round <= MAX_BUYER_ROUNDS; round++) {
    for (const listing of listings) {
      const latest = await prisma.offer.findFirst({
        where: { negotiationId, listingId: listing.id },
        orderBy: { round: "desc" },
      });
      if (!latest || latest.decision !== "REJECTED") continue;

      const unitPriceMinor = counterOfferMinor({
        currentOfferMinor: latest.unitPriceMinor,
        listPriceMinor: listing.listPriceMinor,
        budgetCapMinor: negotiation.budgetCapMinor,
        quantity: negotiation.quantity,
      });
      const decision = decideOffer(unitPriceMinor, listing);
      await prisma.offer.create({
        data: {
          negotiationId,
          listingId: listing.id,
          round,
          unitPriceMinor,
          decision,
          note: decisionNote(decision, `buyer counter, round ${round}`),
        },
      });
    }
  }

  await refreshNegotiationStatus(negotiationId);
}

/**
 * Recompute a negotiation's status from the latest offer per listing and, if
 * it is now AGREED, make sure the order exists.
 */
export async function refreshNegotiationStatus(
  negotiationId: string,
): Promise<string> {
  const offers = await prisma.offer.findMany({
    where: { negotiationId },
    orderBy: [{ round: "desc" }, { createdAt: "desc" }],
  });

  const latestByListing = new Map<string, (typeof offers)[number]>();
  for (const offer of offers) {
    if (!latestByListing.has(offer.listingId)) {
      latestByListing.set(offer.listingId, offer);
    }
  }

  const status = statusFromDecisions(
    [...latestByListing.values()].map(
      (offer) => offer.decision as "ACCEPTED" | "REJECTED" | "PENDING",
    ),
  );

  await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status },
  });

  if (status === "AGREED") await ensureOrder(negotiationId);
  return status;
}

/** Create the order for an agreed negotiation from the recommended deal. */
export async function ensureOrder(negotiationId: string) {
  const existing = await prisma.order.findUnique({
    where: { negotiationId },
  });
  if (existing) return existing;

  const negotiation = await prisma.negotiation.findUniqueOrThrow({
    where: { id: negotiationId },
    include: {
      offers: {
        where: { decision: "ACCEPTED" },
        include: {
          listing: { include: { supplier: true, item: true } },
        },
      },
    },
  });

  const candidates = negotiation.offers.map((offer) => ({
    offerId: offer.id,
    unitPriceMinor: offer.unitPriceMinor,
    deliveryDays: offer.listing.deliveryDays,
    reliabilityScore: offer.listing.supplier.reliabilityScore,
    offer,
  }));

  const best = recommendDeal(candidates);
  if (!best) return null;

  const chosen = candidates.find(
    (candidate) => candidate.offerId === best.offerId,
  )!.offer;

  try {
    return await prisma.order.create({
      data: {
        negotiationId,
        listingId: chosen.listingId,
        agreedUnitPriceMinor: chosen.unitPriceMinor,
        quantity: negotiation.quantity,
        totalMinor: chosen.unitPriceMinor * negotiation.quantity,
        currency: chosen.listing.currency,
        status: "AWAITING_AUTHORIZATION",
        // Terms are frozen the moment the deal is agreed (Increment 5 gate).
        frozenListPriceMinor: chosen.listing.listPriceMinor,
        frozenDeliveryDays: chosen.listing.deliveryDays,
        frozenSpecVersion: chosen.listing.item.specVersion,
        frozenTermsVersion: chosen.listing.termsVersion,
      },
    });
  } catch {
    // Unique constraint on negotiationId: a concurrent caller won the race.
    const order = await prisma.order.findUnique({ where: { negotiationId } });
    if (order) return order;
    throw new Error("Could not create the order");
  }
}

/** Vendor accepts a pending offer: the negotiation is now agreed. */
export async function vendorAcceptOffer(offerId: string, note: string) {
  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: { decision: "ACCEPTED", note },
  });

  // Any other offer still awaiting the vendor is superseded by this deal.
  await prisma.offer.updateMany({
    where: {
      negotiationId: offer.negotiationId,
      id: { not: offer.id },
      decision: "PENDING",
    },
    data: {
      decision: "REJECTED",
      note: "Superseded: the vendor accepted another offer for this negotiation.",
    },
  });

  return refreshNegotiationStatus(offer.negotiationId);
}

/** Vendor rejects a pending offer. */
export async function vendorRejectOffer(offerId: string, note: string) {
  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: { decision: "REJECTED", note },
  });
  return refreshNegotiationStatus(offer.negotiationId);
}

/** Vendor counters a pending offer with its own price. */
export async function vendorCounterOffer(
  offerId: string,
  unitPriceMinor: number,
  note: string,
) {
  const offer = await prisma.offer.findUniqueOrThrow({
    where: { id: offerId },
    include: { listing: true },
  });

  if (unitPriceMinor < offer.listing.floorPriceMinor) {
    throw new Error("The counter is below the supplier's floor price.");
  }

  const highest = await prisma.offer.aggregate({
    where: { negotiationId: offer.negotiationId, listingId: offer.listingId },
    _max: { round: true },
  });
  const nextRound = (highest._max.round ?? offer.round) + 1;

  await prisma.$transaction([
    prisma.offer.update({
      where: { id: offerId },
      data: { decision: "COUNTERED", note },
    }),
    prisma.offer.create({
      data: {
        negotiationId: offer.negotiationId,
        listingId: offer.listingId,
        round: nextRound,
        unitPriceMinor,
        decision: "PENDING",
        note: `Vendor counter at ${formatMoney(unitPriceMinor, offer.listing.currency)}.`,
      },
    }),
  ]);

  return refreshNegotiationStatus(offer.negotiationId);
}

/** Buyer accepts a price the vendor countered with. */
export async function buyerAcceptCounter(offerId: string) {
  const offer = await prisma.offer.findUniqueOrThrow({
    where: { id: offerId },
  });
  if (offer.decision !== "PENDING") {
    throw new Error("That offer is no longer awaiting a decision.");
  }

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      decision: "ACCEPTED",
      note: "Buyer accepted the vendor's counter-offer.",
    },
  });

  await prisma.offer.updateMany({
    where: {
      negotiationId: offer.negotiationId,
      id: { not: offer.id },
      decision: "PENDING",
    },
    data: {
      decision: "REJECTED",
      note: "Superseded: the buyer accepted another offer.",
    },
  });

  return refreshNegotiationStatus(offer.negotiationId);
}

/** Buyer authorizes the agreed order (recorded; status stays awaiting). */
export async function authorizeOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "AWAITING_AUTHORIZATION") {
    throw new Error("This order is not awaiting authorization.");
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { authorizedAt: order.authorizedAt ?? new Date() },
  });
}

/**
 * Buyer confirms the order. Re-reads the live listing/item and blocks the
 * confirmation if any frozen term changed since the deal was agreed.
 */
export async function confirmOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { listing: { include: { item: true } } },
  });

  if (order.status === "CONFIRMED") return order;
  if (!order.authorizedAt) {
    throw new Error("Authorize the order before confirming it.");
  }

  const { listing } = order;
  const { item } = listing;
  const changes: string[] = [];

  if (order.frozenListPriceMinor !== listing.listPriceMinor) {
    changes.push(
      `list price ${formatMoney(
        order.frozenListPriceMinor ?? 0,
        listing.currency,
      )} → ${formatMoney(listing.listPriceMinor, listing.currency)}`,
    );
  }
  if (order.frozenDeliveryDays !== listing.deliveryDays) {
    changes.push(
      `delivery ${order.frozenDeliveryDays} → ${listing.deliveryDays} days`,
    );
  }
  if (order.frozenSpecVersion !== item.specVersion) {
    changes.push(
      `item spec ${order.frozenSpecVersion} → ${item.specVersion}`,
    );
  }
  if (order.frozenTermsVersion !== listing.termsVersion) {
    changes.push(
      `terms ${order.frozenTermsVersion} → ${listing.termsVersion}`,
    );
  }

  if (changes.length > 0) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: "BLOCKED",
        blockReason: changes.join("; "),
      },
    });
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED", blockReason: null },
  });
}

/** Demo control: change a listing's price and bump its terms version. */
export async function simulateSupplierRepricing(listingId: string) {
  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
  });

  // +15% using integer math only.
  const newListPrice = Math.round((listing.listPriceMinor * 115) / 100);
  const match = listing.termsVersion.match(/-R(\d+)$/);
  const nextRevision = match ? Number(match[1]) + 1 : 1;
  const baseVersion = listing.termsVersion.replace(/-R\d+$/, "");
  const newTermsVersion = `${baseVersion}-R${nextRevision}`;

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      listPriceMinor: newListPrice,
      termsVersion: newTermsVersion,
    },
  });
}

export type { OfferDecision };
