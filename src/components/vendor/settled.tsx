import { formatDateTime, formatMoney } from "@/lib/format";
import { EmptyNote, StatusWord } from "@/components/ui";
import { offerDecision } from "@/components/status";
import type { VendorOffer } from "@/components/types";

/** Last decided offers. Read-only record of the desk's recent decisions. */
export function VendorSettled({ offers }: { offers: VendorOffer[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Settled</h2>
        <span className="module__meta">last {offers.length} offers</span>
      </div>

      {offers.length === 0 ? (
        <EmptyNote>Nothing has been decided yet.</EmptyNote>
      ) : (
        <div className="table-scroll">
          <table className="table table--settled">
            <thead>
              <tr>
                <th>Item</th>
                <th>Supplier</th>
                <th className="table__num">Price</th>
                <th>Decision</th>
                <th className="table__num">Time</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="table__primary">
                    <span className="table__name">
                      {offer.negotiation.item.name}
                    </span>
                    <span className="table__sub">
                      {offer.negotiation.item.sku}
                    </span>
                  </td>
                  <td data-label="Supplier">
                    {offer.listing.supplier.name}
                  </td>
                  <td
                    className="table__num table__mono"
                    data-label="Price"
                  >
                    {formatMoney(offer.unitPriceMinor, offer.listing.currency)}
                  </td>
                  <td data-label="Decision">
                    <StatusWord
                      status={offerDecision(offer.decision)}
                      small
                    />
                  </td>
                  <td
                    className="table__num table__time"
                    data-label="Time"
                  >
                    {formatDateTime(offer.updatedAt)}
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
