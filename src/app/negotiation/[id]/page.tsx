import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getNegotiationDetail } from "@/lib/queries";
import { recommendDeal } from "@/lib/negotiation";
import { formatDateTime } from "@/lib/format";
import { headlineStatus, isVendorCounter } from "@/components/status";
import { Banner, Caption, SectionHead, StatusStamp, delay } from "@/components/ui";
import { BriefPanel } from "@/components/negotiation/brief-panel";
import { CounterCallout } from "@/components/negotiation/counter-callout";
import { OrderPanel } from "@/components/negotiation/order-panel";
import { RecommendedPanel } from "@/components/negotiation/recommended-panel";
import { Transcript } from "@/components/negotiation/transcript";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Negotiation transcript",
};

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

  const detail = await getNegotiationDetail(id);
  if (!detail) notFound();

  const currency = detail.rounds[0]?.currency ?? "USD";
  const status = headlineStatus(detail);

  const accepted = detail.rounds.flatMap((round) =>
    round.offers
      .filter((offer) => offer.decision === "ACCEPTED")
      .map((offer) => ({ offer, round })),
  );
  const best = recommendDeal(
    accepted.map(({ offer, round }) => ({
      offerId: offer.id,
      unitPriceMinor: offer.unitPriceMinor,
      deliveryDays: round.deliveryDays,
      reliabilityScore: round.reliabilityScore,
    })),
  );
  const recommended = best
    ? (accepted.find(({ offer }) => offer.id === best.offerId) ?? null)
    : null;

  const pendingCounter =
    detail.rounds
      .flatMap((round) =>
        round.offers
          .filter(
            (offer) =>
              offer.decision === "PENDING" && isVendorCounter(offer.note),
          )
          .map((offer) => ({ offer, round })),
      )
      .at(-1) ?? null;

  const offerCount = detail.rounds.reduce(
    (total, round) => total + round.offers.length,
    0,
  );

  return (
    <div className="wrap">
      <Banner error={error} notice={notice} />

      <header className="reveal grid gap-6 pt-6 pb-8 lg:grid-cols-12 lg:items-end lg:gap-8 lg:pt-10">
        <div className="lg:col-span-8">
          <Link
            href="/"
            className="eyebrow inline-flex items-center gap-2 no-underline transition-colors hover:text-ink"
          >
            <span aria-hidden="true">←</span> Buyer desk
          </Link>
          <p className="eyebrow mt-4">Negotiation</p>
          <h1 className="mt-1.5 font-display text-[26px] leading-tight sm:text-[30px]">
            {detail.item.name}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
            {detail.item.sku} · {detail.item.specVersion} · Buyer{" "}
            {detail.buyerName} · Filed {formatDateTime(detail.createdAt)}
          </p>
        </div>
        <div className="lg:col-span-4 lg:flex lg:justify-end">
          <StatusStamp status={status} />
        </div>
      </header>

      {pendingCounter ? (
        <div className="reveal" style={delay(100)}>
          <CounterCallout
            negotiationId={detail.id}
            offer={pendingCounter.offer}
            round={pendingCounter.round}
            quantity={detail.quantity}
            targetUnitPriceMinor={detail.targetUnitPriceMinor}
          />
        </div>
      ) : null}

      <div className="grid gap-10 pb-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <SectionHead
            index="01"
            title="Transcript"
            aside={
              <span className="eyebrow eyebrow--faint">
                {detail.rounds.length}{" "}
                {detail.rounds.length === 1 ? "supplier" : "suppliers"} ·{" "}
                {offerCount} {offerCount === 1 ? "offer" : "offers"}
              </span>
            }
          />
          <div className="mt-4">
            <Transcript
              rounds={detail.rounds}
              targetUnitPriceMinor={detail.targetUnitPriceMinor}
              recommendedOfferId={recommended?.offer.id ?? null}
            />
          </div>
          <Caption>
            Prices are per unit in {currency}. Supplier policy decides each
            round; borderline prices are decided at the vendor desk, and a
            vendor counter appears here for your decision.
          </Caption>
        </div>

        <aside className="lg:col-span-4">
          <div className="flex flex-col gap-5 lg:sticky lg:top-6">
            <BriefPanel detail={detail} currency={currency} />
            {recommended ? (
              <RecommendedPanel
                offer={recommended.offer}
                round={recommended.round}
                targetUnitPriceMinor={detail.targetUnitPriceMinor}
                quantity={detail.quantity}
              />
            ) : null}
            <OrderPanel
              detail={detail}
              recommended={recommended}
              currency={currency}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
