import { simulateRepricingAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { VendorListing } from "@/components/types";

/**
 * Every listing with its price bands and terms version, plus the demo control
 * that changes the listing so the terms gate can be exercised.
 */
export function Listings({ listings }: { listings: VendorListing[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Listings &amp; terms</h2>
        <span className="module__meta">{listings.length} listings</span>
      </div>

      <div className="table-scroll">
        <table className="table table--listings">
          <thead>
            <tr>
              <th>Item</th>
              <th>Supplier</th>
              <th className="table__num">List</th>
              <th className="table__num">Floor</th>
              <th className="table__num">Accept</th>
              <th className="table__num">Reject</th>
              <th>Terms</th>
              <th className="table__num">Stock</th>
              <th className="table__num">Delivery</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td className="table__primary">
                  <span className="table__name">{listing.item.name}</span>
                  <span className="table__sub">{listing.item.sku}</span>
                </td>
                <td className="nowrap" data-label="Supplier">
                  {listing.supplier.name}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="List"
                >
                  {formatMoney(listing.listPriceMinor, listing.currency)}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Floor"
                >
                  {formatMoney(listing.floorPriceMinor, listing.currency)}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Accept"
                >
                  {formatMoney(listing.autoAcceptFloorMinor, listing.currency)}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Reject"
                >
                  {formatMoney(listing.autoRejectBelowMinor, listing.currency)}
                </td>
                <td className="table__mono-muted" data-label="Terms">
                  {listing.termsVersion}
                </td>
                <td
                  className="table__num table__mono"
                  data-label="Stock"
                >
                  {listing.stock}
                </td>
                <td
                  className="table__num table__time"
                  data-label="Delivery"
                >
                  {listing.deliveryDays} days
                </td>
                <td className="table__action">
                  <form action={simulateRepricingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button
                      type="submit"
                      className="btn btn--secondary btn--sm"
                      title="Reprice the listing by +15% and bump its terms version"
                    >
                      Simulate repricing
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
