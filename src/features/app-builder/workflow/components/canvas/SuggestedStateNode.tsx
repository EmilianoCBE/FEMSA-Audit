import { cn } from "@/shared/lib/cn";
import type { SuggestedState } from "../../types";

type SuggestedStateNodeProps = {
  state: SuggestedState;
  selected?: boolean;
  /** Fase 2: al elegirlo se decide en el inspector si se agrega al flujo o se quita. */
  onSelect?: () => void;
};

export function SuggestedStateNode({ state, selected = false, onSelect }: SuggestedStateNodeProps) {
  const className = cn(
    "absolute h-[60px] w-[152px] rounded-md border-[1.5px] border-dashed border-accent-line bg-accent-bg/60 px-[11px] py-[9px] text-left",
    selected && "border-accent shadow-[0_0_0_2px_var(--color-accent-bg)]",
  );
  const content = (
    <>
      <div className="text-tiny font-semibold text-accent uppercase">{state.kind}</div>
      <div className="text-body-sm font-medium text-accent">{state.name}</div>
    </>
  );
  if (!onSelect) {
    return (
      <div className={className} style={{ left: state.position.x, top: state.position.y }}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Estado sugerido ${state.name}`}
      aria-pressed={selected}
      className={className}
      style={{ left: state.position.x, top: state.position.y }}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}
