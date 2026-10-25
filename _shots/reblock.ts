/**
 * Re-apply the repricing that the seeded BLOCKED order was blocked by, and leave
 * it applied. The order's frozen values were captured at agreement (before the
 * change), so this makes frozen != live and the blocked state real rather than
 * cosmetic. Prints the resulting frozen/live pairs.
 */
import { prisma } from "../src/lib/db";
import { simulateSupplierRepricing } from "../src/lib/negotiation-service";

async function main() {
  const order = await prisma.order.findFirstOrThrow({
    where: { status: "BLOCKED" },
    include: { listing: true },
  });
  console.log("blocked order", order.id, "listing", order.listingId);
  console.log("frozen", order.frozenListPriceMinor, order.frozenDeliveryDays, order.frozenSpecVersion, order.frozenTermsVersion);
  console.log("live before", order.listing.listPriceMinor, order.listing.deliveryDays, order.listing.termsVersion);

  await simulateSupplierRepricing(order.listingId);

  const after = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { listing: true, negotiation: { include: { item: true } } },
  });
  console.log("live after", after.listing.listPriceMinor, after.listing.deliveryDays, after.listing.termsVersion);
  console.log("spec", after.negotiation.item.specVersion);
  console.log("blockReason", after.blockReason);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
