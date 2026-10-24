import { formatDateTime, formatMoney } from "@/lib/format";
import { EmptyNote, StatusStamp } from "@/components/ui";
import { offerDecision } from "@/components/status";
import type { VendorOffer } from "@/components/types";

/** Settled offers, compact table. Read-only record of the last decisions. */
export function DecidedFeed({ offers }: { offers: VendorOffer[] }) {
  if (offers.length === 0) {
    return <EmptyNote>Nothing settled yet.</EmptyNote>;
  }

  return (
    <table className="table min-w-[420px]">
      <thead>
        <tr>
          <th>Item</th>
          <th className="table__num">Unit price</th>
          <th>Decision</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>
              <span className="table__name">
                {offer.negotiation.item.name}
              </span>
              <span className="table__sub">
                {offer.listing.supplier.name}
              </span>
            </td>
            <td className="table__num table__mono">
              {formatMoney(offer.unitPriceMinor, offer.listing.currency)}
            </td>
            <td>
              <StatusStamp status={offerDecision(offer.decision)} />
            </td>
            <td className="whitespace-nowrap text-[12px] text-ink-faint">
              {formatDateTime(offer.updatedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
