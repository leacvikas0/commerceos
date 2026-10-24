import { formatMoney } from "@/lib/format";
import { buyerOfferNote, offerDecision } from "@/components/status";
import { StatusStamp } from "@/components/ui";
import type { NegotiationRound } from "@/components/types";

function deltaLabel(diff: number, currency: string): string {
  if (diff === 0) return "at target";
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(diff), currency)} vs target`;
}

/**
 * The round-by-round record, grouped by supplier. Buyer-facing copy: no
 * floors, no threshold values — only the decision and who has the turn.
 */
export function Transcript({
  rounds,
  targetUnitPriceMinor,
  recommendedOfferId,
}: {
  rounds: NegotiationRound[];
  targetUnitPriceMinor: number;
  recommendedOfferId: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {rounds.map((round, index) => {
        const latest = round.offers[round.offers.length - 1];
        const isRecommendedSupplier =
          recommendedOfferId !== null &&
          round.offers.some((offer) => offer.id === recommendedOfferId);

        return (
          <article
            key={round.listingId}
            className={`panel panel--flush reveal ${
              isRecommendedSupplier ? "edge edge--olive" : ""
            }`}
            style={{ animationDelay: `${180 + index * 70}ms` }}
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-4 py-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.25rem] leading-tight">
                  {round.supplierName}
                </h3>
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-faint">
                  Score {round.reliabilityScore}/100 · {round.deliveryDays} days ·
                  list {formatMoney(round.listPriceMinor, round.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isRecommendedSupplier ? (
                  <span className="eyebrow tone-olive">Recommended</span>
                ) : null}
                <StatusStamp
                  status={offerDecision(latest?.decision ?? "PENDING")}
                  quiet
                />
              </div>
            </header>

            <ol>
              {round.offers.map((offer, offerIndex) => {
                const isRecommended = offer.id === recommendedOfferId;
                const previous = round.offers[offerIndex - 1];
                const isCounter =
                  offer.decision === "PENDING" &&
                  previous?.decision === "COUNTERED";

                return (
                  <li
                    key={offer.id}
                    className={`grid grid-cols-[2rem_1fr_auto] items-start gap-x-3 border-b border-rule px-4 py-3 last:border-b-0 ${
                      isRecommended ? "recommended-row" : ""
                    }`}
                  >
                    <span className="num pt-0.5 text-[0.6rem] text-ink-faint">
                      {String(offer.round).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="price text-[1.12rem]">
                          {formatMoney(offer.unitPriceMinor, round.currency)}
                        </span>
                        <span className="font-mono text-[0.66rem] text-ink-faint">
                          {deltaLabel(
                            offer.unitPriceMinor - targetUnitPriceMinor,
                            round.currency,
                          )}
                        </span>
                        {isCounter ? (
                          <span className="eyebrow tone-ochre">
                            Vendor counter
                          </span>
                        ) : null}
                        {isRecommended ? (
                          <span className="eyebrow tone-olive">Recommended</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[0.75rem] leading-snug text-ink-soft">
                        {buyerOfferNote(
                          offer.decision,
                          offer.note,
                          offer.round,
                        )}
                      </p>
                    </div>
                    <div className="pt-0.5">
                      <StatusStamp
                        status={offerDecision(offer.decision)}
                        quiet
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </div>
  );
}
