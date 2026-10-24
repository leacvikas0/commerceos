import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { Leader } from "@/components/ui";
import type { NegotiationDetail } from "@/components/types";

/** Buyer-side brief for the negotiation: the requirement, not supplier policy. */
export function BriefPanel({
  detail,
  currency,
}: {
  detail: NegotiationDetail;
  currency: string;
}) {
  return (
    <div className="panel panel--flush">
      <div className="panel__head">
        <h2 className="eyebrow">The brief</h2>
        <span className="eyebrow eyebrow--faint">Buyer</span>
      </div>
      <div className="panel__body">
        <p className="font-display text-[1.35rem] leading-tight">
          {detail.buyerName}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Leader label="Quantity">{detail.quantity} units</Leader>
          <Leader label="Target / unit">
            {formatMoney(detail.targetUnitPriceMinor, currency)}
          </Leader>
          <Leader label="Budget cap">
            {formatMoney(detail.budgetCapMinor, currency)}
          </Leader>
          <Leader label="Deadline">{formatDate(detail.deadline)}</Leader>
          <Leader label="Filed">{formatDateTime(detail.createdAt)}</Leader>
        </div>
        <p className="mt-4 border-t border-rule pt-3 text-[0.7rem] leading-relaxed text-ink-faint">
          Target and budget are the buyer&apos;s numbers. Supplier policy is not
          shown on this page.
        </p>
      </div>
    </div>
  );
}
