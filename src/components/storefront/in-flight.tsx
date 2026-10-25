import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyNote, StatusWord } from "@/components/ui";
import type { StatusDescriptor } from "@/components/status";

export type InFlightRow = {
  id: string;
  sku: string;
  itemName: string;
  quantity: number;
  rounds: number;
  bestOfferMinor: number | null;
  currency: string;
  status: StatusDescriptor;
  filed: Date;
};

/** Negotiations that have not settled yet. */
export function InFlight({ rows }: { rows: InFlightRow[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">In flight</h2>
        <span className="module__meta">
          {rows.length === 0 ? "None" : `${rows.length} open`}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyNote>No open negotiations. Raise a requisition above.</EmptyNote>
      ) : (
        <div className="table-scroll">
          <table className="table table--inflight">
            <thead>
              <tr>
                <th>Item</th>
                <th className="table__num">Qty</th>
                <th className="table__num">Rounds</th>
                <th className="table__num">Best</th>
                <th>State</th>
                <th className="table__num">Filed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="table__primary">
                    <Link
                      href={`/negotiation/${row.id}`}
                      className="table__name"
                    >
                      {row.itemName}
                    </Link>
                    <span className="table__sub">{row.sku}</span>
                  </td>
                  <td
                    className="table__num table__mono"
                    data-label="Qty"
                  >
                    {row.quantity}
                  </td>
                  <td
                    className="table__num table__mono"
                    data-label="Rounds"
                  >
                    {row.rounds}
                  </td>
                  <td
                    className="table__num table__mono"
                    data-label="Best"
                  >
                    {row.bestOfferMinor === null
                      ? "—"
                      : formatMoney(row.bestOfferMinor, row.currency)}
                  </td>
                  <td data-label="State">
                    <StatusWord status={row.status} small />
                  </td>
                  <td
                    className="table__num table__time"
                    data-label="Filed"
                  >
                    {formatDate(row.filed)}
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
