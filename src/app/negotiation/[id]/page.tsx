import { cache } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNegotiationDetail } from "@/lib/queries";
import { recommendDeal } from "@/lib/negotiation";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  buyerOfferNote,
  headlineStatus,
  isVendorCounter,
  offerDecision,
} from "@/components/status";
import { Banner, Sep, StatusWord } from "@/components/ui";
import { PageHead } from "@/components/shell/page-head";
import { CounterBanner } from "@/components/negotiation/counter-banner";
import { TermsChanged } from "@/components/negotiation/terms-changed";
import { Suppliers, type SupplierRow } from "@/components/negotiation/suppliers";
import { Deal, type DealData } from "@/components/negotiation/deal";
import { OrderGate } from "@/components/negotiation/order-gate";
import { Rounds, type RoundRow } from "@/components/negotiation/rounds";
import {
  Transcript,
  type TranscriptRow,
} from "@/components/negotiation/transcript";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

// One read per request, shared by the metadata and the page body.
const getDetail = cache(getNegotiationDetail);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getDetail(id);

  if (!detail) {
    return { title: "Negotiation not found" };
  }

  const status = headlineStatus(detail);

  return {
    title: detail.item.name,
    description: `${status.label}. ${detail.quantity} units of ${detail.item.name} for ${detail.buyerName}.`,
  };
}

export default async function NegotiationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { error, notice } = await searchParams;
  await connection();

  const detail = await getDetail(id);
  if (!detail) notFound();

  const currency =
    detail.order?.currency ?? detail.rounds[0]?.currency ?? "USD";
  const status = headlineStatus(detail);

  const offers = detail.rounds.flatMap((round) =>
    round.offers.map((offer) => ({ offer, round })),
  );
  const accepted = offers.filter(
    ({ offer }) => offer.decision === "ACCEPTED",
  );
  const pending = offers.filter(({ offer }) => offer.decision === "PENDING");
  // Recommend among accepted offers; before a deal exists, recommend the best
  // offer still on the table so the supplier rail stays useful.
  const recommendedPool = accepted.length > 0 ? accepted : pending;
  const best = recommendDeal(
    recommendedPool.map(({ offer, round }) => ({
      offerId: offer.id,
      unitPriceMinor: offer.unitPriceMinor,
      deliveryDays: round.deliveryDays,
      reliabilityScore: round.reliabilityScore,
    })),
  );
  const recommended = best
    ? (recommendedPool.find(({ offer }) => offer.id === best.offerId) ?? null)
    : null;
  const acceptedRecommended = recommended?.offer.decision === "ACCEPTED" ? recommended : null;

  const supplierRows: SupplierRow[] = detail.rounds.map((round) => {
    const latest = round.offers[round.offers.length - 1];
    return {
      listingId: round.listingId,
      supplierName: round.supplierName,
      priceMinor: latest?.unitPriceMinor ?? round.listPriceMinor,
      deliveryDays: round.deliveryDays,
      reliabilityScore: round.reliabilityScore,
      status: latest
        ? offerDecision(latest.decision)
        : { label: "No offer", tone: "neutral" },
      recommended: recommended?.round.listingId === round.listingId,
      currency,
    };
  });

  let deal: DealData | null = null;
  if (detail.order) {
    const orderRound = detail.rounds.find(
      (round) => round.listingId === detail.order!.listingId,
    );
    deal = {
      totalMinor: detail.order.totalMinor,
      unitMinor: detail.order.agreedUnitPriceMinor,
      quantity: detail.order.quantity,
      supplierName:
        orderRound?.supplierName ??
        recommended?.round.supplierName ??
        "Supplier",
      deliveryDays: orderRound?.deliveryDays ?? 0,
      currency: detail.order.currency,
      fromOrder: true,
    };
  } else if (acceptedRecommended) {
    deal = {
      totalMinor: acceptedRecommended.offer.unitPriceMinor * detail.quantity,
      unitMinor: acceptedRecommended.offer.unitPriceMinor,
      quantity: detail.quantity,
      supplierName: acceptedRecommended.round.supplierName,
      deliveryDays: acceptedRecommended.round.deliveryDays,
      currency,
      fromOrder: false,
    };
  }

  const roundRows: RoundRow[] = offers
    .map(({ offer, round }) => ({
      id: offer.id,
      round: offer.round,
      supplierName: round.supplierName,
      priceMinor: offer.unitPriceMinor,
      decision: offerDecision(offer.decision),
      note: buyerOfferNote(offer.decision, offer.note, offer.round),
      currency,
    }))
    .sort(
      (a, b) =>
        a.round - b.round || a.supplierName.localeCompare(b.supplierName),
    );

  const transcriptRows: TranscriptRow[] = [...offers]
    .sort(
      (a, b) => a.offer.createdAt.getTime() - b.offer.createdAt.getTime(),
    )
    .map(({ offer, round }) => ({
      id: offer.id,
      time: offer.createdAt,
      supplierName: round.supplierName,
      round: offer.round,
      priceMinor: offer.unitPriceMinor,
      decision: offerDecision(offer.decision),
      note: buyerOfferNote(offer.decision, offer.note, offer.round),
      currency,
    }));

  const pendingCounter =
    offers.find(
      ({ offer }) =>
        offer.decision === "PENDING" && isVendorCounter(offer.note),
    ) ?? null;

  return (
    <>
      <PageHead
        eyebrow={`Buyer · ${detail.item.sku}`}
        title={detail.item.name}
        meta={
          <>
            <StatusWord status={status} />
            <Sep />
            <span>{detail.buyerName}</span>
            <Sep />
            <span>{detail.quantity} units</span>
            <Sep />
            <span>target {formatMoney(detail.targetUnitPriceMinor, currency)}</span>
            <Sep />
            <span>budget {formatMoney(detail.budgetCapMinor, currency)}</span>
            <Sep />
            <span>deadline {formatDate(detail.deadline)}</span>
            <Sep />
            <span>filed {formatDateTime(detail.createdAt)}</span>
          </>
        }
      />

      <Banner error={error} notice={notice} />

      {pendingCounter ? (
        <CounterBanner
          negotiationId={detail.id}
          offerId={pendingCounter.offer.id}
          unitPriceMinor={pendingCounter.offer.unitPriceMinor}
          quantity={detail.quantity}
          currency={currency}
        />
      ) : null}

      <div className="grid12">
        {detail.order?.status === "BLOCKED" ? (
          <div className="span-12">
            <TermsChanged order={detail.order} currency={currency} />
          </div>
        ) : null}

        <div className="span-8">
          <Suppliers rows={supplierRows} />
        </div>

        <div className="span-4">
          <Deal
            deal={deal}
            fallback={{
              targetUnitPriceMinor: detail.targetUnitPriceMinor,
              budgetCapMinor: detail.budgetCapMinor,
              deadline: detail.deadline,
              supplierState:
                detail.status === "REJECTED" ? "No deal" : "Awaiting",
              currency,
            }}
          />
        </div>

        <div className="span-8">
          <Rounds rows={roundRows} />
        </div>

        <div className="span-4">
          <OrderGate detail={detail} />
        </div>

        <div className="span-12">
          <Transcript rows={transcriptRows} />
        </div>
      </div>
    </>
  );
}
