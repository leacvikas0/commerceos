import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { headlineStatus } from "@/components/status";
import { EmptyNote, StatusStamp } from "@/components/ui";
import type { RecentNegotiation } from "@/components/types";

/** The desk's ledger: the most recent negotiations, newest first. */
export function RecentLedger({
  negotiations,
  currency,
}: {
  negotiations: RecentNegotiation[];
  currency: string;
}) {
  if (negotiations.length === 0) {
    return (
      <EmptyNote>
        Nothing on file yet. The first requisition above will open the ledger.
      </EmptyNote>
    );
  }

  return (
    <table className="ledger">
      <thead>
        <tr>
          <th scope="col">Filed</th>
          <th scope="col">Item</th>
          <th scope="col" className="num">
            Qty
          </th>
          <th scope="col" className="num">
            Target
          </th>
          <th scope="col">Status</th>
          <th scope="col">
            <span className="sr-only">Transcript</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {negotiations.map((negotiation) => {
          const status = headlineStatus(negotiation);
          return (
            <tr key={negotiation.id}>
              <td data-label="Filed" className="num whitespace-nowrap">
                {formatDate(negotiation.createdAt)}
              </td>
              <td data-label="Item">
                <Link
                  href={`/negotiation/${negotiation.id}`}
                  className="ledger__primary no-underline decoration-rule underline-offset-4 hover:underline"
                >
                  {negotiation.item.name}
                </Link>
                <span className="ledger__sub">
                  {negotiation.item.sku}
                  {negotiation.order
                    ? ` · ${formatMoney(negotiation.order.totalMinor, negotiation.order.currency)} agreed`
                    : ""}
                </span>
              </td>
              <td data-label="Qty" className="num">
                {negotiation.quantity}
              </td>
              <td data-label="Target" className="num">
                {formatMoney(negotiation.targetUnitPriceMinor, currency)}
              </td>
              <td data-label="Status">
                <StatusStamp status={status} quiet />
              </td>
              <td className="justify-end">
                <Link
                  href={`/negotiation/${negotiation.id}`}
                  className="btn btn--quiet"
                >
                  Open
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
