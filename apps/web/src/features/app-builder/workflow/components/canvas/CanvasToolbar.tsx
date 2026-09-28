const toolClassName = "rounded px-[7px] py-[3px] text-control text-muted hover:bg-bg hover:text-ink-2";

export function CanvasToolbar() {
  return (
    <div className="absolute top-3.5 right-3.5 flex gap-1 rounded-[5px] border border-line-2 bg-surface p-[3px] shadow-[0_1px_2px_rgba(17,24,39,.05)]">
      <button type="button" aria-label="Alejar" className={toolClassName}>
        −
      </button>
      <button type="button" aria-label="Restablecer zoom" className={toolClassName}>
        100%
      </button>
      <button type="button" aria-label="Acercar" className={toolClassName}>
        +
      </button>
    </div>
  );
}
