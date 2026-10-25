import { prisma } from "../src/lib/db";
import {
  authorizeOrder,
  confirmOrder,
  ensureOrder,
  runNegotiation,
  simulateSupplierRepricing,
  vendorAcceptOffer,
} from "../src/lib/negotiation-service";

/**
 * Small, readable demo seed.
 * All money values are integer minor units (cents) + ISO currency code.
 *
 * Listing bands are ordered deliberately:
 *   floorPriceMinor <= autoRejectBelowMinor < autoAcceptFloorMinor <= listPriceMinor
 * so a buyer offer can land in all three decision bands.
 *
 * After the catalogue is seeded, three demo negotiations are driven through the
 * real negotiation service so the app opens with the three states worth
 * showing: one awaiting the vendor, one confirmed, one blocked by a terms
 * change. Re-running the seed reproduces exactly this demo state.
 */
async function main() {
  // Clear in FK-safe order (demo database only).
  await prisma.order.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.negotiation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();

  const paper = await prisma.item.create({
    data: {
      sku: "PAP-A4-80",
      name: "A4 Copy Paper, 80 gsm",
      description:
        "500 sheets per ream, FSC-certified, 80 gsm multipurpose office paper.",
      specVersion: "spec-2026.1",
    },
  });

  const gloves = await prisma.item.create({
    data: {
      sku: "GLV-NIT-M",
      name: "Nitrile Gloves, Medium",
      description:
        "Powder-free examination gloves, 100 per box, medium, blue.",
      specVersion: "spec-2026.3",
    },
  });

  const northwind = await prisma.supplier.create({
    data: { name: "Northwind Paper Co.", reliabilityScore: 92 },
  });
  const atlas = await prisma.supplier.create({
    data: { name: "Atlas Industrial Supply", reliabilityScore: 78 },
  });
  const meridian = await prisma.supplier.create({
    data: { name: "Meridian Office Goods", reliabilityScore: 85 },
  });

  await prisma.listing.createMany({
    data: [
      {
        itemId: paper.id,
        supplierId: northwind.id,
        listPriceMinor: 3200,
        floorPriceMinor: 2450,
        currency: "USD",
        stock: 12000,
        deliveryDays: 3,
        autoAcceptFloorMinor: 2900,
        autoRejectBelowMinor: 2600,
        active: true,
        termsVersion: "NW-terms-2026.02",
      },
      {
        itemId: paper.id,
        supplierId: meridian.id,
        listPriceMinor: 3050,
        floorPriceMinor: 2300,
        currency: "USD",
        stock: 8000,
        deliveryDays: 5,
        autoAcceptFloorMinor: 2800,
        autoRejectBelowMinor: 2500,
        active: true,
        termsVersion: "MO-terms-2026.01",
      },
      {
        itemId: paper.id,
        supplierId: atlas.id,
        listPriceMinor: 3400,
        floorPriceMinor: 2600,
        currency: "USD",
        stock: 20000,
        deliveryDays: 2,
        autoAcceptFloorMinor: 3100,
        autoRejectBelowMinor: 2750,
        active: true,
        termsVersion: "AT-terms-2026.04",
      },
      {
        itemId: gloves.id,
        supplierId: atlas.id,
        listPriceMinor: 780,
        floorPriceMinor: 540,
        currency: "USD",
        stock: 50000,
        deliveryDays: 4,
        autoAcceptFloorMinor: 700,
        autoRejectBelowMinor: 600,
        active: true,
        termsVersion: "AT-terms-2026.04",
      },
      {
        itemId: gloves.id,
        supplierId: meridian.id,
        listPriceMinor: 820,
        floorPriceMinor: 590,
        currency: "USD",
        stock: 30000,
        deliveryDays: 6,
        autoAcceptFloorMinor: 720,
        autoRejectBelowMinor: 640,
        active: true,
        termsVersion: "MO-terms-2026.01",
      },
    ],
  });

  const buyer = await prisma.buyer.create({
    data: {
      name: "Acme Facilities Group",
      currency: "USD",
      budgetCapMinor: 250000, // $2,500.00 procurement budget for this demo
    },
  });

  const deadline = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  async function openNegotiation(input: {
    sku: string;
    quantity: number;
    targetUnitPriceMinor: number;
    budgetCapMinor: number;
  }) {
    const item = await prisma.item.findFirstOrThrow({
      where: { sku: input.sku },
    });
    const negotiation = await prisma.negotiation.create({
      data: {
        buyerId: buyer.id,
        itemId: item.id,
        quantity: input.quantity,
        targetUnitPriceMinor: input.targetUnitPriceMinor,
        budgetCapMinor: input.budgetCapMinor,
        deadline: deadline(7),
        status: "OPEN",
      },
    });
    await runNegotiation(negotiation.id);
    return negotiation.id;
  }

  async function pendingOfferFrom(negotiationId: string, supplierName: string) {
    return prisma.offer.findFirstOrThrow({
      where: {
        negotiationId,
        decision: "PENDING",
        listing: { supplier: { name: supplierName } },
      },
      include: { listing: true },
    });
  }

  // 1. Paper, $27.00 target — the opening offers land inside every supplier's
  //    review band, so this negotiation waits on the vendor desk.
  const awaitingVendorId = await openNegotiation({
    sku: "PAP-A4-80",
    quantity: 100,
    targetUnitPriceMinor: 2700,
    budgetCapMinor: 400000,
  });

  // 2. Paper again — the vendor accepts Meridian's $27.00, the buyer
  //    authorizes, and the order is confirmed against the live terms.
  const confirmedId = await openNegotiation({
    sku: "PAP-A4-80",
    quantity: 100,
    targetUnitPriceMinor: 2700,
    budgetCapMinor: 400000,
  });
  const meridianOffer = await pendingOfferFrom(
    confirmedId,
    "Meridian Office Goods",
  );
  await vendorAcceptOffer(
    meridianOffer.id,
    "Vendor accepted this price at the desk.",
  );
  const confirmedOrder = await ensureOrder(confirmedId);
  if (!confirmedOrder) throw new Error("Confirmed demo order was not created");
  await authorizeOrder(confirmedOrder.id);
  await confirmOrder(confirmedOrder.id);

  // 3. Gloves, $7.00 target — the vendor accepts, the supplier then reprices
  //    the listing and changes its terms before confirmation, so the order is
  //    blocked and nothing is charged.
  const blockedId = await openNegotiation({
    sku: "GLV-NIT-M",
    quantity: 100,
    targetUnitPriceMinor: 700,
    budgetCapMinor: 400000,
  });
  const meridianGlovesOffer = await pendingOfferFrom(
    blockedId,
    "Meridian Office Goods",
  );
  await vendorAcceptOffer(
    meridianGlovesOffer.id,
    "Vendor accepted this price at the desk.",
  );
  const blockedOrder = await ensureOrder(blockedId);
  if (!blockedOrder) throw new Error("Blocked demo order was not created");
  await simulateSupplierRepricing(blockedOrder.listingId);
  await authorizeOrder(blockedOrder.id);
  await confirmOrder(blockedOrder.id);

  const scenarios = await prisma.negotiation.findMany({
    where: { id: { in: [awaitingVendorId, confirmedId, blockedId] } },
    include: { item: true, order: true },
  });

  console.log("Seed complete:", {
    items: await prisma.item.count(),
    suppliers: await prisma.supplier.count(),
    listings: await prisma.listing.count(),
    buyers: await prisma.buyer.count(),
    negotiations: await prisma.negotiation.count(),
  });
  for (const scenario of scenarios) {
    console.log(
      `  ${scenario.item.sku}  negotiation ${scenario.status.padEnd(11)} order ${
        scenario.order?.status ?? "—"
      }`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
