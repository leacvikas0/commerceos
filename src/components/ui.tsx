import type { ReactNode } from "react";
import type { StatusDescriptor } from "./status";

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
      <span className="shrink-0 text-[12px] font-semibold">
        {isError ? "Error" : "Notice"}
      </span>
      <p className="leading-snug">{error ?? notice}</p>
    </div>
  );
}

const toneClass: Record<string, string> = {
  olive: "pill--green",
  oxblood: "pill--red",
  ochre: "pill--amber",
  ink: "pill--gray",
  faint: "pill--gray",
};

/** A compact status pill. */
export function StatusStamp({
  status,
  plain = false,
}: {
  status: StatusDescriptor;
  plain?: boolean;
}) {
  return (
    <span
      className={`pill ${toneClass[status.tone] ?? "pill--gray"}${
        plain ? " pill--plain" : ""
      }`}
    >
      {status.label}
    </span>
  );
}

/** Label / value row used in the compact cards. */
export function Leader({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[12px] text-ink-faint">{label}</span>
      <span className={`text-[12.5px] text-ink ${mono ? "mono num" : ""}`}>
        {value}
      </span>
    </div>
  );
}

/** Quiet empty state used inside cards and tables. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
