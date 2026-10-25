import { formatMoney } from "@/lib/format";

type Tick = { label: string; value: number };

/**
 * The supplier's price window, drawn once to scale. Floors and thresholds are
 * vendor-only and never leave this page.
 */
export function Band({
  offered,
  floor,
  reject,
  accept,
  list,
  currency,
}: {
  offered: number;
  floor: number;
  reject: number;
  accept: number;
  list: number;
  currency: string;
}) {
  const lo = Math.min(floor, reject, accept, offered);
  const hi = Math.max(list, offered, accept, reject);
  const span = Math.max(1, hi - lo);
  const pad = span * 0.06;
  const domainLo = lo - pad;
  const domainSpan = span + pad * 2;
  const pos = (value: number) => ((value - domainLo) / domainSpan) * 100;

  const ticks: Tick[] = [
    { label: "Floor", value: floor },
    { label: "Reject", value: reject },
    { label: "Accept", value: accept },
    { label: "List", value: list },
  ];
  const ordered = [...ticks].sort((a, b) => a.value - b.value);
  const firstLabel = ordered[0]?.label;
  const lastLabel = ordered[ordered.length - 1]?.label;

  const money = (minor: number) => formatMoney(minor, currency);

  let caption: string;
  if (offered > accept) {
    caption = `Offer is ${money(offered - accept)} above the accept line, outside the review band.`;
  } else if (offered < reject) {
    caption = `Offer is ${money(reject - offered)} below the reject line, outside the review band.`;
  } else if (offered === accept) {
    caption = "Offer sits exactly on the accept line.";
  } else if (offered === reject) {
    caption = "Offer sits exactly on the reject line.";
  } else {
    caption = `Offer is ${money(Math.abs(offered - reject))} over the reject line, ${money(
      Math.abs(accept - offered),
    )} under the accept line.`;
  }

  return (
    <div className="band">
      <div className="band__plot">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="band__tick"
            style={{ left: `${pos(tick.value)}%` }}
          />
        ))}
        <span
          className="band__marker"
          style={{ left: `${pos(offered)}%` }}
        />
        <span
          className="band__marker-label"
          style={{ left: `${pos(offered)}%` }}
        >
          {money(offered)}
        </span>
      </div>

      <div className="band__scale">
        {ticks.map((tick) => {
          const edge =
            tick.label === firstLabel
              ? " band__label--start"
              : tick.label === lastLabel
                ? " band__label--end"
                : "";
          return (
            <span
              key={tick.label}
              className={`band__label${edge}`}
              style={{ left: `${pos(tick.value)}%` }}
            >
              <span className="band__label-name">{tick.label}</span>
              <span className="band__label-value">{money(tick.value)}</span>
            </span>
          );
        })}
      </div>

      <p className="band__caption">{caption}</p>
    </div>
  );
}
