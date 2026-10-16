import { Fragment } from "react";

export function Breadcrumbs({ items }: { items: readonly string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-[7px] text-body-sm text-muted">
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        return (
          <Fragment key={item}>
            {index > 0 && <span className="text-line-2">/</span>}
            <span className={isCurrent ? "font-medium text-ink" : undefined} aria-current={isCurrent ? "page" : undefined}>
              {item}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
