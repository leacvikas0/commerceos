/** Read-only dump of the current demo state, for grounding the wireframes. */
import { prisma } from "../src/lib/db";

async function main() {
  const pending = await prisma.offer.findMany({
    where: { decision: "PENDING", negotiation: { status: { in: ["AWAITING_VENDOR", "OPEN"] } } },
    include: { listing: { include: { supplier: true } }, negotiation: { include: { item: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log("PENDING OFFERS", pending.length);
  for (const o of pending) {
    console.log(
      `  ${o.negotiation.item.name} | ${o.listing.supplier.name} | offer ${o.unitPriceMinor} | list ${o.listing.listPriceMinor} | floor ${o.listing.floorPriceMinor} | reject ${o.listing.autoRejectBelowMinor} | accept ${o.listing.autoAcceptFloorMinor} | ${o.listing.termsVersion}`,
    );
  }

  const negs = await prisma.negotiation.findMany({
    include: { item: true, order: true, offers: { include: { listing: { include: { supplier: true } } }, orderBy: [{ round: "asc" }] } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  for (const n of negs) {
    console.log(
      `\nNEG ${n.id} ${n.item.sku} qty=${n.quantity} target=${n.targetUnitPriceMinor} cap=${n.budgetCapMinor} status=${n.status} order=${n.order?.status ?? "none"} authorizedAt=${n.order?.authorizedAt ?? "-"} orderCreated=${n.order?.createdAt ?? "-"}`,
    );
    for (const o of n.offers) {
      console.log(
        `  r${o.round} ${o.listing.supplier.name} ${o.unitPriceMinor} ${o.decision} note="${o.note}"`,
      );
    }
  }
  const counts = {
    items: await prisma.item.count(),
    listings: await prisma.listing.count(),
    negotiations: await prisma.negotiation.count(),
  };
  console.log("\nCOUNTS", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
