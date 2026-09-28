import type { ReactNode } from "react";

export function EmptyState({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-2 bg-surface px-6 py-10 text-center">
      <div className="text-body font-medium text-ink-2">{title}</div>
      {description && <div className="mt-1 text-body-sm text-muted">{description}</div>}
    </div>
  );
}
