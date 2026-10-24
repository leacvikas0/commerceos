import { connection } from "next/server";
import type { Metadata } from "next";
import { getRecentNegotiations, getStorefront } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { Banner, Leader, SectionHead } from "@/components/ui";
import { RequisitionForm } from "@/components/storefront/requisition-form";
import { ItemIndex } from "@/components/storefront/item-index";
import { RecentLedger } from "@/components/storefront/recent-ledger";

// Cache Components: this route reads the database and request data on every
// request, so it is allowed to block instead of prerendering a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Buyer workspace",
};

export default async function BuyerDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  await connection();

  const [storefront, recent] = await Promise.all([
    getStorefront(),
    getRecentNegotiations(6),
  ]);
  const { buyer, items } = storefront;
  const supplierCount = items.reduce(
    (total, item) => total + item.offers.length,
    0,
  );

  return (
    <div className="wrap">
      <Banner error={error} notice={notice} />

      <section className="grid gap-8 pt-8 pb-8 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="lg:col-span-8">
          <p className="eyebrow">Buyer workspace</p>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight sm:text-[32px]">
            New requisition
          </h1>
          <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-ink-soft">
            Set the requirement once. The buyer agent opens with every active
            supplier, answers their counters, and brings anything borderline to
            a human vendor. You authorize the agreed deal, then confirm the
            order.
          </p>
        </div>

        <aside className="lg:col-span-4">
          <div className="panel">
            <div className="panel__head">
              <h2 className="text-[13px] font-semibold">Buyer account</h2>
              <span className="text-[12px] text-ink-faint">On file</span>
            </div>
            <div className="panel__body">
              <p className="text-[15px] font-semibold">{buyer.name}</p>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className="text-[12px] text-ink-faint">Budget cap</span>
                <span className="price text-[22px]">
                  {formatMoney(buyer.budgetCapMinor, buyer.currency)}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-rule pt-3">
                <Leader label="Currency">{buyer.currency}</Leader>
                <Leader label="Active listings">{supplierCount}</Leader>
                <Leader label="Catalogue items">{items.length}</Leader>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
                The cap covers the whole purchase, not a unit price. The agent
                never offers above it.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 pb-10 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="lg:col-span-7">
          <RequisitionForm buyer={buyer} items={items} />

          <div className="mt-4 rounded-lg border border-rule bg-paper p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-faint">
              How offers are decided
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-olive" />
                <div>
                  <p className="text-[12.5px] font-semibold">Auto-decided</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                    A strong opening is accepted by supplier policy without a
                    human.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ochre" />
                <div>
                  <p className="text-[12.5px] font-semibold">Needs a vendor</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                    Borderline prices wait on the vendor desk; any counter shows
                    up here.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-oxblood" />
                <div>
                  <p className="text-[12.5px] font-semibold">Declined</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
                    A low offer is declined automatically; the agent may counter
                    once more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <h2 className="font-display text-[17px] leading-tight">Catalog</h2>
            <span className="text-[12px] text-ink-faint">By list price</span>
          </div>
          <p className="mt-2 mb-3 text-[13px] leading-relaxed text-ink-soft">
            Every active listing is invited to the negotiation. The item chosen
            in the requisition sets what is quoted.
          </p>
          <ItemIndex items={items} />
        </aside>
      </section>

      <section className="pb-4">
        <SectionHead
          title="Recent negotiations"
          aside={
            <span className="text-[12px] text-ink-faint">
              {recent.length === 0
                ? "Nothing filed"
                : `Last ${recent.length} on file`}
            </span>
          }
        />
        <div className="panel panel--flush mt-3">
          <RecentLedger negotiations={recent} currency={buyer.currency} />
        </div>
      </section>
    </div>
  );
}
