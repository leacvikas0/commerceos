import { formatMoney } from "@/lib/format";
import { StatusWord } from "@/components/ui";
import type { StatusDescriptor } from "@/components/status";

export type SupplierRow = {
  listingId: string;
  supplierName: string;
  priceMinor: number;
  deliveryDays: number;
  reliabilityScore: number;
  status: StatusDescriptor;
  recommended: boolean;
  currency: string;
};

/** Every supplier still in play, with its latest offer. No floors on this page. */
export function Suppliers({ rows }: { rows: SupplierRow[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Suppliers</h2>
        <span className="module__meta">
          {rows.length} supplier{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="table-scroll">
        <table className="table table--suppliers">
          <thead>
            <tr>
              <th>Supplier</th>
              <th className="table__num">Unit price</th>
              <th className="table__num">Delivery</th>
              <th className="table__num">Reliability</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.listingId}>
                <td className="table__primary">
                  <span className="table__name">{row.supplierName}</span>
                  {row.recommended ? (
                    <span className="tag-rec">Recommended</span>
                  ) : null}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Unit price"
                >
                  {formatMoney(row.priceMinor, row.currency)}
                </td>
                <td
                  className="table__num table__time"
                  data-label="Delivery"
                >
                  {row.deliveryDays} days
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Reliability"
                >
                  {row.reliabilityScore}/100
                </td>
                <td data-label="State">
                  <StatusWord status={row.status} small />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
