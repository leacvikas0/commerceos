import { connection } from "next/server";
import type { Metadata } from "next";
import { getVendorDashboard } from "@/lib/queries";
import { isVendorCounter } from "@/components/status";
import { Banner, EmptyNote, StatusWord } from "@/components/ui";
import { PageHead } from "@/components/shell/page-head";
import { Queue } from "@/components/vendor/queue";
import { OfferReview } from "@/components/vendor/offer-review";
import { Decision } from "@/components/vendor/decision";
import { VendorSettled } from "@/components/vendor/settled";
import { Listings } from "@/components/vendor/listings";

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
  const queue = pending.filter(
    (pendingOffer) => !isVendorCounter(pendingOffer.note),
  );
  const selectedId = queue.some((item) => item.id === offer)
    ? offer!
    : (queue[0]?.id ?? null);
  const selected = queue.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <PageHead
        eyebrow="Vendor"
        title="Review desk"
        meta={
          <span>
            Offers inside the supplier&apos;s review band wait here. Policy
            settles everything outside it.
          </span>
        }
        aside={
          <StatusWord
            status={
              queue.length > 0
                ? { label: `${queue.length} need a decision`, tone: "waiting" }
                : { label: "Nothing needs a decision", tone: "neutral" }
            }
          />
        }
      />

      <Banner error={error} notice={notice} />

      <div className="grid12">
        <div className="span-4">
          <Queue offers={queue} selectedId={selectedId} />
        </div>

        {selected ? (
          <>
            <div className="span-5">
              <OfferReview offer={selected} />
            </div>
            <div className="span-3">
              <Decision offer={selected} />
            </div>
          </>
        ) : (
          <>
            <div className="span-5">
              <section className="module">
                <div className="module__head">
                  <h2 className="module__label">Offer review</h2>
                </div>
                <EmptyNote>
                  Select an offer from the queue to see it against the
                  supplier&apos;s window.
                </EmptyNote>
              </section>
            </div>
            <div className="span-3">
              <section className="module">
                <div className="module__head">
                  <h2 className="module__label">Decision</h2>
                </div>
                <EmptyNote>No offer selected.</EmptyNote>
              </section>
            </div>
          </>
        )}

        <div className="span-12">
          <VendorSettled offers={decided} />
        </div>

        <div className="span-12">
          <Listings listings={listings} />
        </div>
      </div>
    </>
  );
}
