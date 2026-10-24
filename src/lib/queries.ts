import { prisma } from "./db";

/**
 * Read models for the two surfaces.
 *
 * Buyer-facing DTOs deliberately exclude supplier floors and auto-decision
 * thresholds: those values never leave the vendor side.
 */

export async function getBuyer() {
  return prisma.buyer.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
}

export async function getStorefront() {
  const buyer = await getBuyer();
  const items = await prisma.item.findMany({
    orderBy: { name: "asc" },
    include: {
      listings: {
        where: { active: true },
        include: { supplier: true },
        orderBy: { listPriceMinor: "asc" },
      },
    },
  });

  return {
    buyer,
    items: items.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description,
      specVersion: item.specVersion,
      offers: item.listings.map((listing) => ({
        supplierName: listing.supplier.name,
        reliabilityScore: listing.supplier.reliabilityScore,
        listPriceMinor: listing.listPriceMinor,
        deliveryDays: listing.deliveryDays,
        currency: listing.currency,
        inStock: listing.stock > 0,
      })),
    })),
  };
}

export type NegotiationRound = {
  listingId: string;
  supplierName: string;
  reliabilityScore: number;
  deliveryDays: number;
  listPriceMinor: number;
  currency: string;
  offers: Array<{
    id: string;
    round: number;
    unitPriceMinor: number;
    decision: string;
    note: string | null;
    createdAt: Date;
  }>;
};

export async function getNegotiationDetail(negotiationId: string) {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: {
      buyer: true,
      item: true,
      order: { include: { listing: true } },
      offers: {
        include: {
          listing: { include: { supplier: true } },
        },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!negotiation) return null;

  const byListing = new Map<string, NegotiationRound>();
  for (const offer of negotiation.offers) {
    const existing = byListing.get(offer.listingId);
    if (existing) {
      existing.offers.push({
        id: offer.id,
        round: offer.round,
        unitPriceMinor: offer.unitPriceMinor,
        decision: offer.decision,
        note: offer.note,
        createdAt: offer.createdAt,
      });
      continue;
    }
    byListing.set(offer.listingId, {
      listingId: offer.listingId,
      supplierName: offer.listing.supplier.name,
      reliabilityScore: offer.listing.supplier.reliabilityScore,
      deliveryDays: offer.listing.deliveryDays,
      listPriceMinor: offer.listing.listPriceMinor,
      currency: offer.listing.currency,
      offers: [
        {
          id: offer.id,
          round: offer.round,
          unitPriceMinor: offer.unitPriceMinor,
          decision: offer.decision,
          note: offer.note,
          createdAt: offer.createdAt,
        },
      ],
    });
  }

  return {
    id: negotiation.id,
    status: negotiation.status,
    quantity: negotiation.quantity,
    targetUnitPriceMinor: negotiation.targetUnitPriceMinor,
    budgetCapMinor: negotiation.budgetCapMinor,
    deadline: negotiation.deadline,
    createdAt: negotiation.createdAt,
    buyerName: negotiation.buyer.name,
    item: {
      name: negotiation.item.name,
      sku: negotiation.item.sku,
      specVersion: negotiation.item.specVersion,
    },
    rounds: [...byListing.values()],
    order: negotiation.order
      ? {
          id: negotiation.order.id,
          listingId: negotiation.order.listingId,
          status: negotiation.order.status,
          agreedUnitPriceMinor: negotiation.order.agreedUnitPriceMinor,
          quantity: negotiation.order.quantity,
          totalMinor: negotiation.order.totalMinor,
          currency: negotiation.order.currency,
          // Structured frozen terms (captured at agreement) plus the listing's
          // live values, so the confirm gate can render old vs new without
          // parsing the free-text blockReason.
          frozenListPriceMinor: negotiation.order.frozenListPriceMinor,
          frozenDeliveryDays: negotiation.order.frozenDeliveryDays,
          frozenSpecVersion: negotiation.order.frozenSpecVersion,
          frozenTermsVersion: negotiation.order.frozenTermsVersion,
          liveListPriceMinor: negotiation.order.listing.listPriceMinor,
          liveDeliveryDays: negotiation.order.listing.deliveryDays,
          liveTermsVersion: negotiation.order.listing.termsVersion,
          liveSpecVersion: negotiation.item.specVersion,
          blockReason: negotiation.order.blockReason,
          authorizedAt: negotiation.order.authorizedAt,
          createdAt: negotiation.order.createdAt,
        }
      : null,
  };
}

export async function getRecentNegotiations(limit = 6) {
  return prisma.negotiation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { item: true, order: true },
  });
}

export async function getVendorDashboard() {
  const [pending, decided, listings] = await Promise.all([
    prisma.offer.findMany({
      where: {
        decision: "PENDING",
        negotiation: { status: { in: ["AWAITING_VENDOR", "OPEN"] } },
      },
      include: {
        negotiation: { include: { buyer: true, item: true } },
        listing: { include: { supplier: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.offer.findMany({
      where: { decision: { in: ["ACCEPTED", "REJECTED", "COUNTERED"] } },
      include: {
        negotiation: { include: { buyer: true, item: true } },
        listing: { include: { supplier: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.listing.findMany({
      include: { supplier: true, item: true },
      orderBy: [{ itemId: "asc" }, { listPriceMinor: "asc" }],
    }),
  ]);

  return { pending, decided, listings };
}
