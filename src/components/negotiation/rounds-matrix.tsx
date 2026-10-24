import { formatMoney } from "@/lib/format";
import { StatusStamp } from "@/components/ui";
import { offerDecision } from "@/components/status";
import type { NegotiationRound } from "@/components/types";

/**
 * Rounds matrix: one row per supplier, one column per negotiation round, plus
 * delivery and reliability. The recommended supplier is tagged and tinted.
 */
export function RoundsMatrix({
  rounds,
  currency,
  recommendedOfferId,
  columns,
}: {
  rounds: NegotiationRound[];
  currency: string;
  recommendedOfferId: string | null;
  columns: number;
}) {
  const roundColumns = Array.from({ length: columns }, (_, index) => index + 1);

  return (
    <table className="table min-w-[560px]">
      <thead>
        <tr>
          <th>Supplier</th>
          {roundColumns.map((round) => (
            <th key={round} className="table__num">
              Round {round}
            </th>
          ))}
          <th className="table__num">Delivery</th>
          <th className="table__num">Reliability</th>
        </tr>
      </thead>
      <tbody>
        {rounds.map((round) => {
          const recommended = round.offers.some(
            (offer) => offer.id === recommendedOfferId,
          );
          return (
            <tr
              key={round.listingId}
              className={recommended ? "matrix__row--recommended" : undefined}
            >
              <td className="matrix__supplier">
                {round.supplierName}
                {recommended ? (
                  <span className="matrix__tag">Recommended</span>
                ) : null}
              </td>
              {roundColumns.map((column) => {
                const offer = round.offers.find(
                  (candidate) => candidate.round === column,
                );
                return (
                  <td key={column} className="matrix__cell table__num">
                    {offer ? (
                      <div className="matrix__cell-inner">
                        <span className="matrix__price">
                          {formatMoney(offer.unitPriceMinor, currency)}
                        </span>
                        <StatusStamp status={offerDecision(offer.decision)} />
                      </div>
                    ) : (
                      <span className="matrix__empty">—</span>
                    )}
                  </td>
                );
              })}
              <td className="table__num text-[12px] text-ink-soft">
                {round.deliveryDays}d
              </td>
              <td className="table__num text-[12px] text-ink-soft">
                {round.reliabilityScore}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
