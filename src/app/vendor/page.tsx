import { connection } from "next/server";
import type { Metadata } from "next";
import { getVendorDashboard } from "@/lib/queries";
import { isVendorCounter } from "@/components/status";
import { Banner, SectionHead, StatusStamp } from "@/components/ui";
import { BandLegend } from "@/components/vendor/band-legend";
import { PendingQueue } from "@/components/vendor/pending-queue";
import { DecidedFeed } from "@/components/vendor/decided-feed";
import { ListingsPanel } from "@/components/vendor/listings-panel";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Vendor workspace",
};

export default async function VendorDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  await connection();

  const { pending, decided, listings } = await getVendorDashboard();

  // A vendor counter creates a pending offer addressed to the buyer; it must
  // not appear back in the vendor's own queue.
  const queue = pending.filter((offer) => !isVendorCounter(offer.note));
  const autoAccepted = decided.filter((offer) =>
    offer.note?.startsWith("Auto-accepted"),
  ).length;
  const autoRejected = decided.filter((offer) =>
    offer.note?.startsWith("Auto-rejected"),
  ).length;
  const countered = decided.filter(
    (offer) => offer.decision === "COUNTERED",
  ).length;

  return (
    <div className="wrap">
      <Banner error={error} notice={notice} />

      <section className="grid gap-8 pt-8 pb-8 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="lg:col-span-8">
          <p className="eyebrow">Vendor workspace</p>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight sm:text-[32px]">
            Pending offers
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-ink-soft">
            Supplier policy settles anything outside the review band on its own.
            The offers below need a human call: accept, reject, or counter at or
            above your floor.
          </p>
          <p className="mt-2 max-w-[64ch] text-[12.5px] leading-relaxed text-ink-faint">
            Floors and decision thresholds appear on this page only.
          </p>
        </div>

        <aside className="lg:col-span-4">
          <div className="panel">
            <div className="panel__head">
              <h2 className="text-[13px] font-semibold">Pending review</h2>
              <StatusStamp
                status={{ label: `${queue.length} open`, tone: "ochre" }}
              />
            </div>
            <div className="panel__body">
              <p className="price text-[26px]">{queue.length}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">
                borderline offers in the queue, oldest first
              </p>
              <div className="mt-4 flex gap-6 border-t border-rule pt-3">
                <div>
                  <p className="text-[11px] text-ink-faint">Auto-accepted</p>
                  <p className="num mt-0.5 text-[15px] font-semibold">
                    {autoAccepted}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">Auto-rejected</p>
                  <p className="num mt-0.5 text-[15px] font-semibold">
                    {autoRejected}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">Counters sent</p>
                  <p className="num mt-0.5 text-[15px] font-semibold">
                    {countered}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
                Auto figures cover the last 12 settled offers.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="pb-8">
        <SectionHead title="Decision bands" />
        <div className="mt-3">
          <BandLegend />
        </div>
      </section>

      <section className="pb-8">
        <SectionHead
          title="Review queue"
          aside={
            <span className="text-[12px] text-ink-faint">
              {queue.length === 0 ? "Clear" : `${queue.length} awaiting a call`}
            </span>
          }
        />
        <div className="mt-3">
          <PendingQueue offers={queue} />
        </div>
      </section>

      <section className="pb-8">
        <SectionHead
          title="Settled offers"
          aside={
            <span className="text-[12px] text-ink-faint">
              Read-only · last {decided.length}
            </span>
          }
        />
        <div className="panel panel--flush mt-3">
          <DecidedFeed offers={decided} />
        </div>
      </section>

      <section className="pb-4">
        <SectionHead
          title="Listings & terms"
          aside={
            <span className="text-[12px] text-ink-faint">
              {listings.length} listings
            </span>
          }
        />
        <p className="mt-2 mb-3 max-w-[64ch] text-[13px] leading-relaxed text-ink-soft">
          Price bands and terms live on the listing. Repricing a listing after a
          deal has been agreed is how the terms gate gets exercised on the buyer
          side.
        </p>
        <ListingsPanel listings={listings} />
      </section>
    </div>
  );
}
