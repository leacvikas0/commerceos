"use client";

import { useState } from "react";
import { startNegotiationAction } from "@/app/actions";
import { formatMoney } from "@/lib/format";

export type RequisitionItem = {
  id: string;
  name: string;
  currency: string;
  lowestListPriceMinor: number | null;
};

function targetDefault(lowestListPriceMinor: number | null): string {
  if (lowestListPriceMinor === null) return "";
  const minor = Math.round((lowestListPriceMinor * 85) / 100);
  return (minor / 100).toFixed(2);
}

function moneySymbol(currency: string): string {
  return currency === "USD" ? "$" : currency;
}

/**
 * The one client-side form on the buyer page: the target defaults to 85% of
 * the selected item's lowest list price and follows the item until the buyer
 * edits it themselves.
 */
export function RequisitionForm({
  items,
  budgetCapMinor,
  currency,
}: {
  items: RequisitionItem[];
  budgetCapMinor: number;
  currency: string;
}) {
  const first = items[0] ?? null;
  const [itemId, setItemId] = useState(first?.id ?? "");
  const [target, setTarget] = useState(
    targetDefault(first?.lowestListPriceMinor ?? null),
  );
  const [targetTouched, setTargetTouched] = useState(false);

  function handleItemChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = items.find((item) => item.id === event.target.value) ?? null;
    setItemId(event.target.value);
    if (!targetTouched) {
      setTarget(targetDefault(next?.lowestListPriceMinor ?? null));
    }
  }

  function handleTargetChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTarget(event.target.value);
    setTargetTouched(true);
  }

  const symbol = moneySymbol(currency);

  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">New requisition</h2>
        <span className="module__meta">
          Sets the terms for every active supplier
        </span>
      </div>

      <div className="module__body">
        {items.length === 0 ? (
          <p className="empty">No catalogue items are seeded yet.</p>
        ) : (
          <form action={startNegotiationAction}>
            <div className="requisition">
              <div className="field requisition__item">
                <label htmlFor="itemId" className="field__label">
                  Item
                </label>
                <select
                  id="itemId"
                  name="itemId"
                  required
                  value={itemId}
                  onChange={handleItemChange}
                  className="input"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.lowestListPriceMinor !== null
                        ? ` — from ${formatMoney(
                            item.lowestListPriceMinor,
                            item.currency,
                          )}`
                        : ""}
                    </option>
                  ))}
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
                  Target / unit
                </label>
                <div className="affix">
                  <span className="affix__prefix" aria-hidden="true">
                    {symbol}
                  </span>
                  <input
                    id="targetPrice"
                    name="targetPrice"
                    inputMode="decimal"
                    value={target}
                    onChange={handleTargetChange}
                    required
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="budgetCap" className="field__label">
                  Budget cap
                </label>
                <div className="affix">
                  <span className="affix__prefix" aria-hidden="true">
                    {symbol}
                  </span>
                  <input
                    id="budgetCap"
                    name="budgetCap"
                    inputMode="decimal"
                    defaultValue={(budgetCapMinor / 100).toFixed(2)}
                    required
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="deadlineDays" className="field__label">
                  Deadline
                </label>
                <div className="affix affix--suffix">
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
                  <span className="affix__suffix" aria-hidden="true">
                    days
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn--primary requisition__submit"
              >
                Start negotiation
              </button>
            </div>

            <p className="requisition__hint">
              Target defaults to 85% of the lowest list price. Nothing is
              charged; you authorize and confirm the order separately.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
