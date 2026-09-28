import type { CanvasAnnotation, CanvasWarning } from "../../types";

export function CanvasWarningDot({ warning }: { warning: CanvasWarning }) {
  return (
    <div
      role="img"
      aria-label={warning.message}
      title={warning.message}
      className="absolute flex size-4 items-center justify-center rounded-full border border-amber-strong bg-amber-bg text-tiny font-bold text-amber"
      style={{ left: warning.position.x, top: warning.position.y }}
    >
      !
    </div>
  );
}

export function CanvasAnnotationTag({ annotation }: { annotation: CanvasAnnotation }) {
  return (
    <div
      className="absolute inline-flex items-center gap-1 rounded border border-line-2 bg-surface px-1.5 py-0.5 text-caption font-medium text-ink-2 shadow-[0_1px_2px_rgba(17,24,39,.06)]"
      style={{ left: annotation.position.x, top: annotation.position.y }}
    >
      <span className="size-[5px] rounded-full bg-accent" /> {annotation.label}
    </div>
  );
}
