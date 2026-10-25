import { formatMoney } from "@/lib/format";
import { EmptyNote } from "@/components/ui";

export type CatalogueRow = {
  id: string;
  name: string;
  sku: string;
  suppliers: number;
  fastestDeliveryDays: number | null;
  fromMinor: number | null;
  currency: string;
  specVersion: string;
};

/** Catalogue summary: one row per item, cheapest listing first. */
export function Catalogue({ rows }: { rows: CatalogueRow[] }) {
  return (
    <section className="module">
      <div className="module__head">
        <h2 className="module__label">Catalogue</h2>
        <span className="module__meta">by list price</span>
      </div>

      {rows.length === 0 ? (
        <EmptyNote>No catalogue items are seeded yet.</EmptyNote>
      ) : (
        <div>
          {rows.map((row) => (
            <div key={row.id} className="catalogue-row">
              <div className="min-w-0">
                <p className="catalogue-row__name">{row.name}</p>
                <p className="catalogue-row__meta">
                  {row.suppliers} supplier{row.suppliers === 1 ? "" : "s"}
                  {row.fastestDeliveryDays !== null
                    ? ` · ${row.fastestDeliveryDays}-day delivery`
                    : ""}{" "}
                  · {row.specVersion}
                </p>
              </div>
              <p className="catalogue-row__price">
                {row.fromMinor === null
                  ? "—"
                  : `from ${formatMoney(row.fromMinor, row.currency)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
