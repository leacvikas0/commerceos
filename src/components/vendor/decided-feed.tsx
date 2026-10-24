import { formatDateTime, formatMoney } from "@/lib/format";
import type { Tone } from "@/components/status";
import { EmptyNote } from "@/components/ui";
import type { VendorOffer } from "@/components/types";

type Context = { label: string; detail: string; tone: Tone };

/** Restate the stored decision note with the threshold that produced it. */
function policyContext(offer: VendorOffer): Context {
  const note = offer.note ?? "";
  const currency = offer.listing.currency;

  if (note.startsWith("Auto-accepted")) {
    return {
      label: "Auto-accepted",
      detail: `≥ ${formatMoney(offer.listing.autoAcceptFloorMinor, currency)} accept floor`,
      tone: "olive",
    };
  }
  if (note.startsWith("Auto-rejected")) {
    return {
      label: "Auto-rejected",
      detail: `< ${formatMoney(offer.listing.autoRejectBelowMinor, currency)} reject floor`,
      tone: "oxblood",
    };
  }
  if (note.startsWith("Vendor accepted")) {
    return {
      label: "Vendor accepted",
      detail: "decision at the desk",
      tone: "olive",
    };
  }
  if (note.startsWith("Buyer accepted")) {
    return {
      label: "Buyer accepted",
      detail: "counter accepted by buyer",
      tone: "olive",
    };
  }
  if (note.startsWith("Vendor countered")) {
    return {
      label: "Counter sent",
      detail: "awaiting buyer decision",
      tone: "ochre",
    };
  }
  if (note.startsWith("Superseded")) {
    return {
      label: "Superseded",
      detail: "another offer was taken",
      tone: "faint",
    };
  }
  return { label: offer.decision, detail: note, tone: "faint" };
}

/** Read-only feed of everything the desk did not have to touch. */
export function DecidedFeed({ offers }: { offers: VendorOffer[] }) {
  if (offers.length === 0) {
    return (
      <EmptyNote>
        Nothing settled yet. Auto-accepted and auto-rejected offers will appear
        here with the threshold that decided them.
      </EmptyNote>
    );
  }

  return (
    <table className="ledger">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col" className="num">
            Qty
          </th>
          <th scope="col" className="num">
            Offer / unit
          </th>
          <th scope="col">Decision</th>
          <th scope="col">Policy context</th>
          <th scope="col" className="num">
            Updated
          </th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => {
          const context = policyContext(offer);
          return (
            <tr key={offer.id}>
              <td data-label="Item">
                <span className="ledger__primary">
                  {offer.negotiation.item.name}
                </span>
                <span className="ledger__sub">
                  {offer.listing.supplier.name} · {offer.negotiation.buyer.name}
                </span>
              </td>
              <td data-label="Qty" className="num">
                {offer.negotiation.quantity}
              </td>
              <td data-label="Offer / unit" className="num">
                {formatMoney(offer.unitPriceMinor, offer.listing.currency)}
                <span className="ledger__sub">
                  {formatMoney(
                    offer.unitPriceMinor * offer.negotiation.quantity,
                    offer.listing.currency,
                  )}{" "}
                  total
                </span>
              </td>
              <td data-label="Decision">
                <span className={`eyebrow tone-${context.tone}`}>
                  {context.label}
                </span>
              </td>
              <td data-label="Policy context">
                <span className="font-mono text-[0.72rem] text-ink-soft">
                  {context.detail}
                </span>
              </td>
              <td data-label="Updated" className="num whitespace-nowrap">
                {formatDateTime(offer.updatedAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
