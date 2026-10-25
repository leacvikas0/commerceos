import { connection } from "next/server";
import type { Metadata } from "next";
import {
  getNegotiationDetail,
  getRecentNegotiations,
  getStorefront,
} from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { Banner, Sep } from "@/components/ui";
import { headlineStatus } from "@/components/status";
import { PageHead } from "@/components/shell/page-head";
import { RequisitionForm } from "@/components/storefront/requisition-form";
import { InFlight, type InFlightRow } from "@/components/storefront/in-flight";
import {
  Catalogue,
  type CatalogueRow,
} from "@/components/storefront/catalogue";
import { Settled, type SettledRow } from "@/components/storefront/settled";

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
    getRecentNegotiations(12),
  ]);
  const details = (
    await Promise.all(recent.map((negotiation) => getNegotiationDetail(negotiation.id)))
  ).filter((detail) => detail !== null);

  const inFlight: InFlightRow[] = [];
  const settled: SettledRow[] = [];

  for (const detail of details) {
    const offers = detail.rounds.flatMap((round) => round.offers);
    const accepted = offers.filter((offer) => offer.decision === "ACCEPTED");
    const pending = offers.filter((offer) => offer.decision === "PENDING");
    const pool = accepted.length > 0 ? accepted : pending;
    const bestOfferMinor =
      pool.length > 0
        ? Math.min(...pool.map((offer) => offer.unitPriceMinor))
        : null;
    const rounds =
      offers.length > 0 ? Math.max(...offers.map((offer) => offer.round)) : 0;
    const currency =
      detail.order?.currency ??
      detail.rounds[0]?.currency ??
      buyer.currency;
    const status = headlineStatus(detail);

    const orderState = detail.order?.status;
    const closed =
      orderState === "CONFIRMED" ||
      orderState === "CANCELLED" ||
      orderState === "BLOCKED" ||
      (!detail.order && detail.status === "REJECTED");

    if (closed) {
      settled.push({
        id: detail.id,
        sku: detail.item.sku,
        itemName: detail.item.name,
        quantity: detail.quantity,
        priceMinor: detail.order?.agreedUnitPriceMinor ?? bestOfferMinor,
        currency,
        status,
        filed: detail.createdAt,
      });
    } else {
      inFlight.push({
        id: detail.id,
        sku: detail.item.sku,
        itemName: detail.item.name,
        quantity: detail.quantity,
        rounds,
        bestOfferMinor,
        currency,
        status,
        filed: detail.createdAt,
      });
    }
  }

  const catalogue: CatalogueRow[] = items
    .map((item) => {
      const lowest = item.offers[0];
      const fastest =
        item.offers.length > 0
          ? Math.min(...item.offers.map((offer) => offer.deliveryDays))
          : null;
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        suppliers: item.offers.length,
        fastestDeliveryDays: fastest,
        fromMinor: lowest?.listPriceMinor ?? null,
        currency: lowest?.currency ?? buyer.currency,
        specVersion: item.specVersion,
      };
    })
    .sort((a, b) => (a.fromMinor ?? Infinity) - (b.fromMinor ?? Infinity));

  const requisitionItems = items.map((item) => {
    const lowest = item.offers[0];
    return {
      id: item.id,
      name: item.name,
      currency: lowest?.currency ?? buyer.currency,
      lowestListPriceMinor: lowest?.listPriceMinor ?? null,
    };
  });

  return (
    <>
      <PageHead
        eyebrow="Buyer"
        title="Requisition"
        meta={
          <>
            <span>{buyer.name}</span>
            <Sep />
            <span>
              budget {formatMoney(buyer.budgetCapMinor, buyer.currency)}
            </span>
            <Sep />
            <span>{buyer.currency}</span>
          </>
        }
        aside={
          <>
            <span>
              {inFlight.length} in flight
            </span>
            <Sep />{" "}
            <span>{settled.length} settled</span>
          </>
        }
      />

      <Banner error={error} notice={notice} />

      <div className="grid12">
        <div className="span-12">
          <RequisitionForm
            items={requisitionItems}
            budgetCapMinor={buyer.budgetCapMinor}
            currency={buyer.currency}
          />
        </div>

        <div className="span-7">
          <InFlight rows={inFlight} />
        </div>

        <div className="span-5">
          <Catalogue rows={catalogue} />
        </div>

        <div className="span-12">
          <Settled rows={settled} />
        </div>
      </div>
    </>
  );
}
