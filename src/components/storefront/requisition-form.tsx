import { startNegotiationAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { Buyer, StorefrontItem } from "@/components/types";

/**
 * One horizontal requisition row on desktop, stacked on mobile. Plain
 * server-rendered form: the action runs the negotiation and redirects.
 */
export function RequisitionForm({
  buyer,
  items,
}: {
  buyer: Buyer;
  items: StorefrontItem[];
}) {
  const firstItem = items[0];

  return (
    <form action={startNegotiationAction} className="card">
      <div className="card__head">
        <h2 className="card__title">New requisition</h2>
        <span className="card__sub">Runs on submit</span>
      </div>

      <div className="card__body">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_auto] xl:items-end">
          <div className="field md:col-span-2 xl:col-span-1">
            <label htmlFor="itemId" className="field__label">
              Item
            </label>
            <select
              id="itemId"
              name="itemId"
              required
              defaultValue={firstItem?.id}
              className="input"
            >
              {items.map((item) => {
                const lowest = item.offers[0];
                return (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {lowest
                      ? ` — from ${formatMoney(lowest.listPriceMinor, lowest.currency)} / unit`
                      : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field">
            <label htmlFor="quantity" className="field__label">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={50}
              required
              className="input"
            />
          </div>

          <div className="field">
            <label htmlFor="targetPrice" className="field__label">
              Target unit price
            </label>
            <input
              id="targetPrice"
              name="targetPrice"
              inputMode="decimal"
              defaultValue="27.00"
              required
              className="input"
            />
          </div>

          <div className="field">
            <label htmlFor="budgetCap" className="field__label">
              Budget cap
            </label>
            <input
              id="budgetCap"
              name="budgetCap"
              inputMode="decimal"
              defaultValue={(buyer.budgetCapMinor / 100).toFixed(2)}
              required
              className="input"
            />
          </div>

          <div className="field">
            <label htmlFor="deadlineDays" className="field__label">
              Deadline
            </label>
            <input
              id="deadlineDays"
              name="deadlineDays"
              type="number"
              min={1}
              max={90}
              step={1}
              inputMode="numeric"
              defaultValue={14}
              required
              className="input"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary md:col-span-2 xl:col-span-1 xl:self-end"
          >
            Start negotiation
          </button>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          Prices in {buyer.currency}. Nothing is charged; you authorize and
          confirm the order separately.
        </p>
      </div>
    </form>
  );
}
