/**
 * Dev smoke test: drives one full negotiation through the real database and
 * prints the resulting rounds. Run with: npx tsx scripts/smoke.ts
 */
import { prisma } from "../src/lib/db";
import { runNegotiation } from "../src/lib/negotiation-service";

async function main() {
  const buyer = await prisma.buyer.findFirstOrThrow();
  const item = await prisma.item.findFirstOrThrow({
    where: { sku: "PAP-A4-80" },
  });

  const negotiation = await prisma.negotiation.create({
    data: {
      buyerId: buyer.id,
      itemId: item.id,
      quantity: 100,
      targetUnitPriceMinor: 2700,
      budgetCapMinor: 400000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "OPEN",
    },
  });

  await runNegotiation(negotiation.id);

  const detail = await prisma.negotiation.findUniqueOrThrow({
    where: { id: negotiation.id },
    include: {
      offers: {
        include: { listing: { include: { supplier: true } } },
        orderBy: [{ round: "asc" }],
      },
      order: true,
    },
  });

  console.log("negotiation", detail.id, "status:", detail.status);
  for (const offer of detail.offers) {
    console.log(
      `  r${offer.round} ${offer.listing.supplier.name.padEnd(24)} ${String(
        offer.unitPriceMinor,
      ).padStart(6)}  ${offer.decision}`,
    );
  }
  console.log("order:", detail.order?.status ?? "none");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
