/**
 * End-to-end server-flow check (no browser):
 *   negotiation -> vendor accept -> authorize -> confirm -> CONFIRMED
 *   negotiation -> vendor accept -> reprice -> authorize -> confirm -> BLOCKED
 *   negotiation -> vendor counter -> buyer accepts counter -> AGREED
 *
 * Creates its own rows and removes them again, restoring any listing it
 * reprices, so the seeded demo data is left untouched.
 *
 * Run with: npx tsx scripts/e2e.ts
 */
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import {
  authorizeOrder,
  buyerAcceptCounter,
  confirmOrder,
  ensureOrder,
  runNegotiation,
  simulateSupplierRepricing,
  vendorAcceptOffer,
  vendorCounterOffer,
} from "../src/lib/negotiation-service";

const createdNegotiations: string[] = [];

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
  createdNegotiations.push(negotiation.id);
  await runNegotiation(negotiation.id);
  return negotiation.id;
}

async function pendingOffer(negotiationId: string) {
  const offer = await prisma.offer.findFirst({
    where: { negotiationId, decision: "PENDING" },
    include: { listing: true },
    orderBy: { createdAt: "asc" },
  });
  assert.ok(offer, "expected at least one pending offer for the vendor");
  return offer;
}

async function happyPath() {
  const negotiationId = await createNegotiation("PAP-A4-80", 2700);

  const afterEngine = await prisma.negotiation.findUniqueOrThrow({
    where: { id: negotiationId },
  });
  assert.equal(afterEngine.status, "AWAITING_VENDOR");

  const offer = await pendingOffer(negotiationId);
  const status = await vendorAcceptOffer(offer.id, "E2E accept");
  assert.equal(status, "AGREED");

  const order = await ensureOrder(negotiationId);
  assert.ok(order, "order should exist after agreement");
  assert.equal(order.status, "AWAITING_AUTHORIZATION");
  assert.equal(order.totalMinor, offer.unitPriceMinor * 100);
  assert.equal(order.agreedUnitPriceMinor, offer.unitPriceMinor);

  await authorizeOrder(order.id);
  const confirmed = await confirmOrder(order.id);
  assert.equal(confirmed.status, "CONFIRMED");

  console.log(
    `happy path OK — accepted ${offer.unitPriceMinor}, total ${order.totalMinor}, order ${confirmed.status}`,
  );
  return { negotiationId, orderId: order.id, listingId: order.listingId };
}

async function blockedPath() {
  const negotiationId = await createNegotiation("GLV-NIT-M", 700);
  const offer = await pendingOffer(negotiationId);
  await vendorAcceptOffer(offer.id, "E2E accept before repricing");

  const order = await ensureOrder(negotiationId);
  assert.ok(order);

  const listingBefore = await prisma.listing.findUniqueOrThrow({
    where: { id: order.listingId },
  });
  await simulateSupplierRepricing(order.listingId);
  await authorizeOrder(order.id);
  const blocked = await confirmOrder(order.id);
  assert.equal(blocked.status, "BLOCKED");
  assert.ok(blocked.blockReason?.includes("list price"));
  assert.ok(blocked.blockReason?.includes("terms"));

  // Restore the listing so the demo data stays as seeded.
  await prisma.listing.update({
    where: { id: order.listingId },
    data: {
      listPriceMinor: listingBefore.listPriceMinor,
      termsVersion: listingBefore.termsVersion,
    },
  });

  console.log(`reprice gate OK — order ${blocked.status}: ${blocked.blockReason}`);
  return { negotiationId, orderId: order.id };
}

async function counterPath() {
  const negotiationId = await createNegotiation("PAP-A4-80", 2700);
  const offer = await pendingOffer(negotiationId);

  // The vendor counters at a price inside the band, above its floor.
  await vendorCounterOffer(offer.id, 2500, "E2E vendor counter");

  const counter = await prisma.offer.findFirstOrThrow({
    where: {
      negotiationId,
      decision: "PENDING",
      note: { startsWith: "Vendor counter at" },
    },
    orderBy: { round: "desc" },
  });
  assert.equal(counter.unitPriceMinor, 2500);

  const status = await buyerAcceptCounter(counter.id);
  assert.equal(status, "AGREED");

  const order = await ensureOrder(negotiationId);
  assert.ok(order, "order should exist after the buyer accepts the counter");
  assert.equal(order.agreedUnitPriceMinor, 2500);
  assert.equal(order.totalMinor, 2500 * 100);

  console.log(
    `vendor counter OK — counter ${counter.unitPriceMinor}, buyer accepted, order ${order.status}`,
  );
  return { negotiationId, orderId: order.id };
}

async function cleanup() {
  for (const negotiationId of createdNegotiations) {
    await prisma.order.deleteMany({ where: { negotiationId } });
    await prisma.offer.deleteMany({ where: { negotiationId } });
    await prisma.negotiation.delete({ where: { id: negotiationId } });
  }
}

async function main() {
  await happyPath();
  await blockedPath();
  await counterPath();
  await cleanup();
  console.log("e2e OK — demo data restored");
}

main()
  .catch(async (error) => {
    console.error(error);
    await cleanup();
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
