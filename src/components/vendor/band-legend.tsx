/**
 * One-line statement of the supplier decision bands. Floors and thresholds are
 * vendor-only; they never appear on buyer pages.
 */
export function BandLegend() {
  return (
    <div className="legend">
      <span className="legend__item">
        <span className="legend__dot legend__dot--green" />
        Auto-accept at or above the accept floor
      </span>
      <span className="legend__item">
        <span className="legend__dot legend__dot--amber" />
        Borderline → review queue
      </span>
      <span className="legend__item">
        <span className="legend__dot legend__dot--red" />
        Auto-reject below the reject floor
      </span>
      <span className="text-ink-faint">
        The supplier agent settles the outer bands on its own; only the middle
        band reaches this desk.
      </span>
    </div>
  );
}
