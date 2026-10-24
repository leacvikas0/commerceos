import { connection } from "next/server";
import type { Metadata } from "next";
import { getVendorDashboard } from "@/lib/queries";
import { isVendorCounter } from "@/components/status";
import { Banner, EmptyNote, StatusStamp } from "@/components/ui";
import { PageHeader } from "@/components/shell/page-header";
import { BandLegend } from "@/components/vendor/band-legend";
import { PendingList } from "@/components/vendor/pending-list";
import { OfferDetail } from "@/components/vendor/offer-detail";
import { DecidedFeed } from "@/components/vendor/decided-feed";
import { ListingsPanel } from "@/components/vendor/listings-panel";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Review desk",
};

export default async function VendorDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; offer?: string }>;
}) {
  const { error, notice, offer } = await searchParams;
  await connection();

  const { pending, decided, listings } = await getVendorDashboard();

  // A vendor counter creates a pending offer addressed to the buyer; it must
  // not appear back in the vendor's own queue.
  const queue = pending.filter((pendingOffer) =>
    !isVendorCounter(pendingOffer.note),
  );
  const selectedId = queue.some((item) => item.id === offer)
    ? offer!
    : (queue[0]?.id ?? null);
  const selected = queue.find((item) => item.id === selectedId) ?? null;

  const autoAccepted = decided.filter((item) =>
    item.note?.startsWith("Auto-accepted"),
  ).length;
  const autoRejected = decided.filter((item) =>
    item.note?.startsWith("Auto-rejected"),
  ).length;
  const counters = decided.filter(
    (item) => item.decision === "COUNTERED",
  ).length;

  const kpis = [
    { label: "Awaiting decision", value: queue.length, dot: "kpi__dot--amber" },
    { label: "Auto-accepted", value: autoAccepted, dot: "kpi__dot--green" },
    { label: "Auto-rejected", value: autoRejected, dot: "kpi__dot--red" },
    { label: "Counters sent", value: counters, dot: "" },
  ];

  return (
    <>
      <PageHeader
        title="Review desk"
        subtitle="Offers inside the review band wait for a human decision."
        right={
          <StatusStamp
            status={{ label: `${queue.length} pending`, tone: "ochre" }}
          />
        }
      />

      <div className="page">
        <Banner error={error} notice={notice} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi">
              <p className="kpi__label">
                <span className={`kpi__dot ${kpi.dot}`} />
                {kpi.label}
              </p>
              <p className="kpi__value">{kpi.value}</p>
            </div>
          ))}
        </div>

        <BandLegend />

        <div className="queue">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Awaiting decision</h2>
              <span className="card__sub">
                {queue.length === 0 ? "Clear" : `${queue.length} open`}
              </span>
            </div>
            {queue.length === 0 ? (
              <EmptyNote>Nothing in the review band right now.</EmptyNote>
            ) : (
              <PendingList
                offers={queue}
                selectedId={selectedId}
                now={Date.now()}
              />
            )}
          </section>

          {selected ? (
            <OfferDetail offer={selected} />
          ) : (
            <section className="card">
              <EmptyNote>
                Select an offer from the queue to accept, reject or counter it.
              </EmptyNote>
            </section>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Settled</h2>
              <span className="card__sub">
                Last {decided.length} decisions
              </span>
            </div>
            <div className="card__body card__body--flush overflow-x-auto">
              <DecidedFeed offers={decided} />
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <h2 className="card__title">Listings &amp; terms gate</h2>
              <span className="card__sub">{listings.length} listings</span>
            </div>
            <div className="card__body card__body--flush overflow-x-auto">
              <ListingsPanel listings={listings} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
