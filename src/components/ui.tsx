import type { ReactNode } from "react";
import type { StatusDescriptor, Tone } from "./status";

/** Error / notice strip fed by the actions' ?error= and ?notice= params. */
export function Banner({
  error,
  notice,
}: {
  error?: string;
  notice?: string;
}) {
  if (!error && !notice) return null;

  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`banner ${isError ? "banner--error" : "banner--notice"}`}
    >
      <span className="banner__tag">{isError ? "Error" : "Notice"}</span>
      <p>{error ?? notice}</p>
    </div>
  );
}

const toneClass: Record<Tone, string> = {
  waiting: "status--waiting",
  blocked: "status--blocked",
  confirmed: "status--confirmed",
  neutral: "status--neutral",
};

/** A 6px dot and a word. Never a filled pill. */
export function StatusWord({
  status,
  small = false,
}: {
  status: StatusDescriptor;
  small?: boolean;
}) {
  return (
    <span className={`status ${toneClass[status.tone]}${small ? " status--sm" : ""}`}>
      <span className="status__dot" />
      {status.label}
    </span>
  );
}

/** Quiet empty state used inside modules. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

/** Metadata separator used in page heads and table cells. */
export function Sep() {
  return <span className="sep">·</span>;
}
