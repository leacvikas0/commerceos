import { formatMoney } from "@/lib/format";
import type { OrderDetail } from "@/components/types";

/**
 * Blocked order: the structured frozen terms captured at agreement beside the
 * live listing values read at confirmation. Never parsed from free text.
 */
export function TermsChanged({
  order,
  currency,
}: {
  order: OrderDetail;
  currency: string;
}) {
  const rows = [
    {
      label: "List price",
      before:
        order.frozenListPriceMinor === null
          ? "—"
          : formatMoney(order.frozenListPriceMinor, currency),
      after: formatMoney(order.liveListPriceMinor, currency),
      changed:
        order.frozenListPriceMinor !== null &&
        order.frozenListPriceMinor !== order.liveListPriceMinor,
    },
    {
      label: "Delivery",
      before:
        order.frozenDeliveryDays === null
          ? "—"
          : `${order.frozenDeliveryDays} days`,
      after: `${order.liveDeliveryDays} days`,
      changed:
        order.frozenDeliveryDays !== null &&
        order.frozenDeliveryDays !== order.liveDeliveryDays,
    },
    {
      label: "Spec",
      before: order.frozenSpecVersion ?? "—",
      after: order.liveSpecVersion,
      changed:
        order.frozenSpecVersion !== null &&
        order.frozenSpecVersion !== order.liveSpecVersion,
    },
    {
      label: "Terms",
      before: order.frozenTermsVersion ?? "—",
      after: order.liveTermsVersion,
      changed:
        order.frozenTermsVersion !== null &&
        order.frozenTermsVersion !== order.liveTermsVersion,
    },
  ];

  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label module__label--blocked">Terms changed</h2>
        <span className="module__meta">Order blocked</span>
      </div>

      <div className="terms">
        <div className="table-scroll">
          <table className="terms__table">
            <thead>
              <tr>
                <th aria-label="Term" />
                <th>At agreement</th>
                <th>At confirmation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="terms__label">{row.label}</td>
                  <td data-label="At agreement">
                    <span className="terms__value terms__value--same">
                      {row.before}
                    </span>
                  </td>
                  <td data-label="At confirmation">
                    <span
                      className={`terms__value ${
                        row.changed
                          ? "terms__value--changed"
                          : "terms__value--same"
                      }`}
                    >
                      {row.after}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="terms__aside">
          The order was not confirmed. Nothing was charged.
        </p>
      </div>
    </section>
  );
}
