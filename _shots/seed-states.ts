/**
 * Design-review seeding: leaves behind one CONFIRMED and one BLOCKED order so
 * the blocked-order state can be reviewed in the browser. Restores the listing
 * it reprices, like scripts/e2e.ts does.
 */
import { prisma } from "../src/lib/db";
import {
  authorizeOrder,
  confirmOrder,
  ensureOrder,
  runNegotiation,
  simulateSupplierRepricing,
  vendorAcceptOffer,
} from "../src/lib/negotiation-service";

async function createNegotiation(itemSku: string, target: number) {
  const buyer = await prisma.buyer.findFirstOrThrow();
  const item = await prisma.item.findFirstOrThrow({ where: { sku: itemSku } });
  const negotiation = await prisma.negotiation.create({
    data: {
      buyerId: buyer.id,
      itemId: item.id,
      quantity: 100,
      targetUnitPriceMinor: target,
      budgetCapMinor: 400000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "OPEN",
    },
  });
  await runNegotiation(negotiation.id);
  return negotiation.id;
}

async function pendingOffer(negotiationId: string) {
  const offer = await prisma.offer.findFirst({
    where: { negotiationId, decision: "PENDING" },
    orderBy: { createdAt: "asc" },
  });
  if (!offer) throw new Error("no pending offer");
  return offer;
}

async function main() {
  // 1. Confirmed order.
  const confirmedId = await createNegotiation("PAP-A4-80", 2700);
  const offerA = await pendingOffer(confirmedId);
  await vendorAcceptOffer(offerA.id, "Vendor accepted at the desk.");
  const orderA = await ensureOrder(confirmedId);
  if (!orderA) throw new Error("no order A");
  await authorizeOrder(orderA.id);
  const confirmed = await confirmOrder(orderA.id);
  console.log("CONFIRMED", confirmedId, confirmed.status);

  // 2. Blocked order: accept, reprice the listing, then confirm.
  const blockedId = await createNegotiation("GLV-NIT-M", 700);
  const offerB = await pendingOffer(blockedId);
  await vendorAcceptOffer(offerB.id, "Vendor accepted at the desk.");
  const orderB = await ensureOrder(blockedId);
  if (!orderB) throw new Error("no order B");
  const before = await prisma.listing.findUniqueOrThrow({
    where: { id: orderB.listingId },
  });
  await simulateSupplierRepricing(orderB.listingId);
  await authorizeOrder(orderB.id);
  const blocked = await confirmOrder(orderB.id);
  await prisma.listing.update({
    where: { id: orderB.listingId },
    data: {
      listPriceMinor: before.listPriceMinor,
      termsVersion: before.termsVersion,
    },
  });
  console.log("BLOCKED", blockedId, blocked.status, "|", blocked.blockReason);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
