const toolClassName =
  "rounded px-[7px] py-[3px] text-control text-muted hover:bg-bg hover:text-ink-2 disabled:pointer-events-none disabled:opacity-40";

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;

type CanvasToolbarProps = {
  zoom?: number;
  /** Sin esta función los botones se ven pero no hacen nada (vista de solo lectura). */
  onZoomChange?: (zoom: number) => void;
};

export function CanvasToolbar({ zoom = 1, onZoomChange }: CanvasToolbarProps) {
  const index = ZOOM_LEVELS.findIndex((level) => level >= zoom);
  const current = index === -1 ? ZOOM_LEVELS.length - 1 : index;
  return (
    <div className="absolute top-3.5 right-3.5 z-10 flex gap-1 rounded-[5px] border border-line-2 bg-surface p-[3px] shadow-[0_1px_2px_rgba(17,24,39,.05)]">
      <button
        type="button"
        aria-label="Alejar"
        className={toolClassName}
        disabled={!onZoomChange || current === 0}
        onClick={() => onZoomChange?.(ZOOM_LEVELS[current - 1])}
      >
        −
      </button>
      <button
        type="button"
        aria-label="Restablecer zoom"
        className={toolClassName}
        disabled={!onZoomChange}
        onClick={() => onZoomChange?.(1)}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        aria-label="Acercar"
        className={toolClassName}
        disabled={!onZoomChange || current === ZOOM_LEVELS.length - 1}
        onClick={() => onZoomChange?.(ZOOM_LEVELS[current + 1])}
      >
        +
      </button>
    </div>
  );
}
