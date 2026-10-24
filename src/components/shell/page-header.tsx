import { formatMoney } from "@/lib/format";

/**
 * The one topbar shared by every page: page title and subtitle on the left,
 * the buyer account and budget on the right.
 */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div className="min-w-0">
        <h1 className="topbar__title">{title}</h1>
        {subtitle ? <p className="topbar__subtitle">{subtitle}</p> : null}
      </div>
      {right ? <div className="topbar__right">{right}</div> : null}
    </header>
  );
}

export function AccountChip({
  name,
  budgetMinor,
  currency,
}: {
  name: string;
  budgetMinor: number;
  currency: string;
}) {
  return (
    <div className="account-chip">
      <span className="account-chip__name">{name}</span>
      <span className="account-chip__budget">
        Budget {formatMoney(budgetMinor, currency)}
      </span>
    </div>
  );
}
