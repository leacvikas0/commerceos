/**
 * The three supplier decision bands, stated once on the vendor desk.
 * Floors and thresholds are vendor-only; they never appear on buyer pages.
 */
export function BandLegend() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-rule bg-paper p-4">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-olive">
          <span className="h-1.5 w-1.5 rounded-full bg-olive" />
          Auto-accept
        </p>
        <p className="mt-2 text-[13px] font-semibold leading-snug">
          At or above the accept floor
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          The supplier agent takes the price itself. The deal is agreed and an
          order opens for the buyer&apos;s authorization — no vendor needed.
        </p>
      </div>
      <div className="rounded-lg border border-rule bg-paper p-4">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-ochre">
          <span className="h-1.5 w-1.5 rounded-full bg-ochre" />
          Borderline
        </p>
        <p className="mt-2 text-[13px] font-semibold leading-snug">
          Between the two thresholds
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          Inside the review band, so it lands in the queue below. Accept, reject,
          or counter at a price at or above the supplier floor.
        </p>
      </div>
      <div className="rounded-lg border border-rule bg-paper p-4">
        <p className="flex items-center gap-2 text-[12px] font-semibold text-oxblood">
          <span className="h-1.5 w-1.5 rounded-full bg-oxblood" />
          Auto-reject
        </p>
        <p className="mt-2 text-[13px] font-semibold leading-snug">
          Below the reject threshold
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
          The supplier agent declines without asking. The buyer agent may raise
          once more before the negotiation closes.
        </p>
      </div>
    </div>
  );
}
