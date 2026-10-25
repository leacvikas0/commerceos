/**
 * One-line statement of the supplier decision bands. Floors and thresholds are
 * vendor-only; they never appear on buyer pages.
 */
export function BandLegend() {
  return (
    <div className="legend">
      <span className="legend__item">
        <span className="legend__dot legend__dot--green" />
        Auto-accept
      </span>
      <span className="legend__item">
        <span className="legend__dot legend__dot--amber" />
        Borderline
      </span>
      <span className="legend__item">
        <span className="legend__dot legend__dot--red" />
        Auto-reject
      </span>
    </div>
  );
}
