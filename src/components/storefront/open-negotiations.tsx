import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyNote, StatusStamp } from "@/components/ui";
import type { StatusDescriptor } from "@/components/status";

export type OpenNegotiationRow = {
  id: string;
  sku: string;
  itemName: string;
  quantity: number;
  status: StatusDescriptor;
  bestOfferMinor: number | null;
  currency: string;
  suppliers: number;
  filed: Date;
};

/** Compact table of negotiations that have not been settled yet. */
export function OpenNegotiations({ rows }: { rows: OpenNegotiationRow[] }) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Open negotiations</h2>
        <span className="card__sub">
          {rows.length === 0 ? "None" : `${rows.length} active`}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyNote>No open negotiations. Raise a requisition above.</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[560px]">
          <thead>
            <tr>
              <th>Item</th>
              <th className="table__num">Qty</th>
              <th>Status</th>
              <th className="table__num">Best offer</th>
              <th className="table__num">Suppliers</th>
              <th>Filed</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link
                    href={`/negotiation/${row.id}`}
                    className="table__name"
                  >
                    {row.itemName}
                  </Link>
                  <span className="table__sub">{row.sku}</span>
                </td>
                <td className="table__num num">{row.quantity}</td>
                <td>
                  <StatusStamp status={row.status} />
                </td>
                <td className="table__num mono num">
                  {row.bestOfferMinor === null
                    ? "—"
                    : formatMoney(row.bestOfferMinor, row.currency)}
                </td>
                <td className="table__num num">{row.suppliers}</td>
                <td className="whitespace-nowrap text-[12px] text-ink-faint">
                  {formatDate(row.filed)}
                </td>
                <td className="table__num">
                  <Link
                    href={`/negotiation/${row.id}`}
                    className="btn btn--ghost btn--sm"
                    aria-label={`Open ${row.itemName}`}
                  >
                    →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}
