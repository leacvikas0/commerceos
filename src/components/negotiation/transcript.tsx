import { formatDateTime, formatMoney } from "@/lib/format";
import type { StatusDescriptor } from "@/components/status";

export type TranscriptRow = {
  id: string;
  time: Date;
  supplierName: string;
  round: number;
  priceMinor: number;
  decision: StatusDescriptor;
  note: string;
  currency: string;
};

/** Chronological record of every offer in the negotiation. */
export function Transcript({ rows }: { rows: TranscriptRow[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Transcript</h2>
        <span className="module__meta">{rows.length} events</span>
      </div>

      <div className="table-scroll">
        <table className="table table--transcript">
          <thead>
            <tr>
              <th>Time</th>
              <th>Supplier</th>
              <th className="table__num">Round</th>
              <th className="table__num">Price</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="table__time table__primary">
                  {formatDateTime(row.time)}
                </td>
                <td data-label="Supplier">
                  <span className="table__name">{row.supplierName}</span>
                </td>
                <td className="table__num table__mono" data-label="Round">
                  {row.round}
                </td>
                <td className="table__num table__mono" data-label="Price">
                  {formatMoney(row.priceMinor, row.currency)}
                </td>
                <td className="table__note" data-label="Note">
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
