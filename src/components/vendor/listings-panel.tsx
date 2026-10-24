import { simulateRepricingAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { VendorListing } from "@/components/types";

/**
 * Every listing with its price bands and terms version, plus the demo control
 * that changes the listing so the terms gate can be exercised.
 */
export function ListingsPanel({ listings }: { listings: VendorListing[] }) {
  return (
    <table className="table min-w-[760px]">
      <thead>
        <tr>
          <th>Item</th>
          <th>Supplier</th>
          <th className="table__num">List</th>
          <th className="table__num">Floor</th>
          <th className="table__num">Auto-accept</th>
          <th className="table__num">Auto-reject</th>
          <th>Terms</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {listings.map((listing) => (
          <tr key={listing.id}>
            <td>
              <span className="table__name">{listing.item.name}</span>
              <span className="table__sub">{listing.item.sku}</span>
            </td>
            <td className="whitespace-nowrap">{listing.supplier.name}</td>
            <td className="table__num table__mono">
              {formatMoney(listing.listPriceMinor, listing.currency)}
            </td>
            <td className="table__num table__mono">
              {formatMoney(listing.floorPriceMinor, listing.currency)}
            </td>
            <td className="table__num table__mono">
              {formatMoney(listing.autoAcceptFloorMinor, listing.currency)}
            </td>
            <td className="table__num table__mono">
              {formatMoney(listing.autoRejectBelowMinor, listing.currency)}
            </td>
            <td className="table__mono whitespace-nowrap text-[12px] text-ink-faint">
              {listing.termsVersion}
            </td>
            <td className="table__num">
              <form action={simulateRepricingAction}>
                <input type="hidden" name="listingId" value={listing.id} />
                <button
                  type="submit"
                  className="btn btn--outline btn--sm"
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
  );
}
