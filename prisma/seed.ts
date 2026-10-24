import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Small, readable demo seed.
 * All money values are integer minor units (cents) + ISO currency code.
 *
 * Listing bands are ordered deliberately:
 *   floorPriceMinor <= autoRejectBelowMinor < autoAcceptFloorMinor <= listPriceMinor
 * so a buyer offer can land in all three decision bands.
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

  await prisma.buyer.create({
    data: {
      name: "Acme Facilities Group",
      currency: "USD",
      budgetCapMinor: 250000, // $2,500.00 procurement budget for this demo
    },
  });

  const counts = {
    items: await prisma.item.count(),
    suppliers: await prisma.supplier.count(),
    listings: await prisma.listing.count(),
    buyers: await prisma.buyer.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
