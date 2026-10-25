import type { ReactNode } from "react";

/**
 * The one page head shared by every route: mono eyebrow, 30px title, a meta
 * line and a right-aligned aside (counts).
 */
export function PageHead({
  eyebrow,
  title,
  meta,
  aside,
}: {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="pagehead">
      <div className="pagehead__main">
        <p className="pagehead__eyebrow">{eyebrow}</p>
        <h1 className="pagehead__title">{title}</h1>
        {meta ? <div className="pagehead__meta">{meta}</div> : null}
      </div>
      {aside ? <div className="pagehead__aside">{aside}</div> : null}
    </header>
  );
}
