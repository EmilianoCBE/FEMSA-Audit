import { useId } from "react";

type SelectFieldProps = {
  label: string;
  value: string;
  onClick?: () => void;
};

/**
 * Campo con apariencia de select. Por ahora solo muestra el valor;
 * cuando exista el catálogo real se reemplaza por un listbox sin cambiar su API visual.
 */
export function SelectField({ label, value, onClick }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="mb-[11px] last:mb-0">
      <label htmlFor={id} className="mb-1 block text-control text-muted">
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-[5px] border border-line-2 bg-surface px-[9px] py-1.5 text-left text-body-sm/[1.45] text-ink"
      >
        {value} <span className="text-tiny text-muted-2">▾</span>
      </button>
    </div>
  );
}
