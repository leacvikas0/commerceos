import { formatMoney } from "@/lib/format";
import type { StatusDescriptor } from "@/components/status";
import { StatusWord } from "@/components/ui";

export type RoundRow = {
  id: string;
  round: number;
  supplierName: string;
  priceMinor: number;
  decision: StatusDescriptor;
  note: string;
  currency: string;
};

/** Every offer, grouped by round and supplier, with the buyer-safe note. */
export function Rounds({ rows }: { rows: RoundRow[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Rounds</h2>
        <span className="module__meta">{rows.length} offers</span>
      </div>

      <div className="table-scroll">
        <table className="table table--rounds">
          <thead>
            <tr>
              <th>Round</th>
              <th>Supplier</th>
              <th className="table__num">Unit price</th>
              <th>Decision</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="table__primary">
                  <span className="table__name">{row.supplierName}</span>
                </td>
                <td data-label="Round">
                  <span className="tag-round">R{row.round}</span>
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Unit price"
                >
                  {formatMoney(row.priceMinor, row.currency)}
                </td>
                <td data-label="Decision">
                  <StatusWord status={row.decision} small />
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
