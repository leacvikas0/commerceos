import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getNegotiationDetail } from "@/lib/queries";
import { recommendDeal } from "@/lib/negotiation";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { headlineStatus, isVendorCounter } from "@/components/status";
import { Banner, StatusStamp } from "@/components/ui";
import { PageHeader, AccountChip } from "@/components/shell/page-header";
import { RoundsMatrix } from "@/components/negotiation/rounds-matrix";
import { DealCard } from "@/components/negotiation/deal-card";
import { OrderGate } from "@/components/negotiation/order-gate";
import { CounterBanner } from "@/components/negotiation/counter-banner";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Negotiation",
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
        round.offers.map((offer) => ({ offer, round })),
      )
      .find(
        ({ offer }) =>
          offer.decision === "PENDING" && isVendorCounter(offer.note),
      ) ?? null;

  const columns = Math.max(
    3,
    ...detail.rounds.flatMap((round) =>
      round.offers.map((offer) => offer.round),
    ),
  );

  return (
    <>
      <PageHeader
        title="Negotiation"
        subtitle="Round-by-round record and the order gate."
        right={
          <AccountChip
            name={detail.buyerName}
            budgetMinor={detail.budgetCapMinor}
            currency={currency}
          />
        }
      />

      <div className="page">
        <Banner error={error} notice={notice} />

        <p className="text-[12px] text-ink-faint">
          <Link href="/" className="hover:text-ink hover:underline">
            Buyer workspace
          </Link>
          <span className="mx-1.5">/</span>
          <span className="mono">{detail.item.sku}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-[23px] font-semibold leading-tight">
            {detail.item.name}
          </h2>
          <StatusStamp status={status} />
        </div>
        <p className="mt-1 text-[12px] text-ink-faint">
          Qty {detail.quantity} · Target{" "}
          <span className="mono">
            {formatMoney(detail.targetUnitPriceMinor, currency)}
          </span>{" "}
          · Budget{" "}
          <span className="mono">
            {formatMoney(detail.budgetCapMinor, currency)}
          </span>{" "}
          · Deadline {formatDate(detail.deadline)} · Filed{" "}
          {formatDateTime(detail.createdAt)}
        </p>

        {pendingCounter ? (
          <CounterBanner
            negotiationId={detail.id}
            offerId={pendingCounter.offer.id}
            unitPriceMinor={pendingCounter.offer.unitPriceMinor}
            quantity={detail.quantity}
            currency={currency}
          />
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <section className="card">
              <div className="card__head">
                <h2 className="card__title">Rounds</h2>
                <span className="card__sub">
                  {detail.rounds.length} suppliers
                </span>
              </div>
              <div className="card__body card__body--flush overflow-x-auto">
                <RoundsMatrix
                  rounds={detail.rounds}
                  currency={currency}
                  recommendedOfferId={recommended?.offer.id ?? null}
                  columns={columns}
                />
              </div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[76px] lg:self-start">
            <DealCard
              detail={detail}
              currency={currency}
              recommended={recommended}
            />
            <OrderGate detail={detail} currency={currency} />
          </div>
        </div>
      </div>
    </>
  );
}
