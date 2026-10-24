import type { CSSProperties, ReactNode } from "react";
import type { StatusDescriptor, Tone } from "./status";

/** Kept for call-site compatibility; the modern surface does not stagger. */
export function delay(_ms: number): CSSProperties {
  return {};
}

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
  const message = error ?? notice ?? "";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mt-6 flex items-start gap-3 rounded-lg border px-4 py-3 ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide">
        {isError ? "Error" : "Notice"}
      </span>
      <p className="text-[13.5px] leading-snug">{message}</p>
    </div>
  );
}

/** A compact status pill. */
export function StatusStamp({
  status,
  quiet = false,
  className = "",
}: {
  status: StatusDescriptor;
  quiet?: boolean;
  className?: string;
}) {
  const toneClass =
    status.tone === "faint" ? "stamp--ink stamp--quiet" : `stamp--${status.tone}`;
  return (
    <span
      className={`stamp ${toneClass}${quiet ? " stamp--quiet" : ""} ${className}`}
    >
      {status.label}
    </span>
  );
}

/** A label / value row. */
export function Leader({
  label,
  children,
  strong = false,
  tone,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
  tone?: Tone;
}) {
  return (
    <div className="leader">
      <span className="shrink-0 text-[12px] text-ink-faint">{label}</span>
      <span
        className={`leader__value ${strong ? "text-[14px] font-semibold" : ""} ${
          tone ? `tone-${tone}` : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}

/** Section heading with an optional right-hand aside. */
export function SectionHead({
  title,
  aside,
}: {
  index?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
      <h2 className="font-display text-[17px] leading-tight">{title}</h2>
      {aside ? <div>{aside}</div> : null}
    </div>
  );
}

/** Quiet empty-state line. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-rule bg-paper px-4 py-8 text-center text-[13px] text-ink-faint">
      {children}
    </p>
  );
}

/** Small caption used under tables and panels. */
export function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">{children}</p>
  );
}
