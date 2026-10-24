import { startNegotiationAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";
import type { Buyer, StorefrontItem } from "@/components/types";

/**
 * The requisition slip. It is a plain server-rendered form: the server action
 * runs the deterministic negotiation and redirects to the transcript.
 */
export function RequisitionForm({
  buyer,
  items,
}: {
  buyer: Buyer;
  items: StorefrontItem[];
}) {
  const firstItem = items[0];
  const currency = buyer.currency;

  return (
    <form action={startNegotiationAction} className="panel">
      <div className="panel__head">
        <h2 className="text-[15px] font-semibold">Requisition</h2>
        <span className="text-[12px] text-ink-faint">Buyer · {buyer.name}</span>
      </div>

      <div className="panel__body grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label htmlFor="itemId" className="field__label">
            Item
          </label>
          <select
            id="itemId"
            name="itemId"
            required
            defaultValue={firstItem?.id}
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
          <p className="field__hint">
            Every active supplier for the chosen item is invited to quote.
          </p>
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
          />
          <p className="field__hint">Units required, in whole units.</p>
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
            aria-describedby="targetPrice-hint"
          />
          <p className="field__hint" id="targetPrice-hint">
            Your agent opens here and may raise the offer within budget.
          </p>
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
            aria-describedby="budgetCap-hint"
          />
          <p className="field__hint" id="budgetCap-hint">
            Ceiling for the whole purchase, in {currency}.
          </p>
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
            aria-describedby="deadlineDays-hint"
          />
          <p className="field__hint" id="deadlineDays-hint">
            Days from today, 1–90.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-rule px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="max-w-[34ch] text-[12px] leading-relaxed text-ink-faint">
          The negotiation runs the moment you submit. Nothing is charged and no
          order is placed without your authorization.
        </p>
        <button type="submit" className="btn btn--ink sm:shrink-0">
          Start negotiation
        </button>
      </div>
    </form>
  );
}
