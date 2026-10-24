import { connection } from "next/server";
import type { Metadata } from "next";
import {
  getNegotiationDetail,
  getRecentNegotiations,
  getStorefront,
} from "@/lib/queries";
import { Banner } from "@/components/ui";
import { headlineStatus } from "@/components/status";
import { PageHeader, AccountChip } from "@/components/shell/page-header";
import { RequisitionForm } from "@/components/storefront/requisition-form";
import {
  OpenNegotiations,
  type OpenNegotiationRow,
} from "@/components/storefront/open-negotiations";
import { AccountCard } from "@/components/storefront/account-card";
import { CatalogueCard } from "@/components/storefront/catalogue-card";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Requisition",
};

export default async function BuyerWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  await connection();

  const [{ buyer, items }, recent] = await Promise.all([
    getStorefront(),
    getRecentNegotiations(6),
  ]);
  const details = await Promise.all(
    recent.map((negotiation) => getNegotiationDetail(negotiation.id)),
  );

  const rows: OpenNegotiationRow[] = details
    .filter((detail) => detail !== null)
    .filter(
      (detail) =>
        detail.order?.status !== "CONFIRMED" &&
        detail.order?.status !== "CANCELLED",
    )
    .map((detail) => {
      const offers = detail.rounds.flatMap((round) => round.offers);
      const accepted = offers.filter((offer) => offer.decision === "ACCEPTED");
      const pool =
        accepted.length > 0
          ? accepted
          : offers.filter((offer) => offer.decision === "PENDING");
      const bestOfferMinor =
        pool.length > 0
          ? Math.min(...pool.map((offer) => offer.unitPriceMinor))
          : null;

      return {
        id: detail.id,
        sku: detail.item.sku,
        itemName: detail.item.name,
        quantity: detail.quantity,
        status: headlineStatus({ status: detail.status, order: detail.order }),
        bestOfferMinor,
        currency: detail.rounds[0]?.currency ?? buyer.currency,
        suppliers: detail.rounds.length,
        filed: detail.createdAt,
      };
    });

  const activeListings = items.reduce(
    (total, item) => total + item.offers.length,
    0,
  );

  return (
    <>
      <PageHeader
        title="Requisition"
        subtitle="Raise a requirement; the buying agent negotiates with every active supplier."
        right={
          <AccountChip
            name={buyer.name}
            budgetMinor={buyer.budgetCapMinor}
            currency={buyer.currency}
          />
        }
      />

      <div className="page">
        <Banner error={error} notice={notice} />

        <RequisitionForm buyer={buyer} items={items} />

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <OpenNegotiations rows={rows} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <AccountCard
              buyer={buyer}
              activeListings={activeListings}
              catalogueItems={items.length}
            />
            <CatalogueCard items={items} />
          </div>
        </div>
      </div>
    </>
  );
}
