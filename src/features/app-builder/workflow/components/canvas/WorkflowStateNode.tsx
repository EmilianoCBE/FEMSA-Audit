import { cn } from "@/shared/lib/cn";
import type { StateTone, WorkflowState } from "../../types";

const TONE_STRIPE: Record<StateTone, string> = {
  neutral: "bg-muted-2",
  amber: "bg-amber",
  accent: "bg-accent",
  green: "bg-green",
  red: "bg-red",
};

type WorkflowStateNodeProps = {
  state: WorkflowState;
  selected?: boolean;
};

// TODO(US04 - Rafael Valdez): hacer seleccionables las actividades y navegar predecesoras/sucesoras en menos de 3 segundos.
export function WorkflowStateNode({ state, selected = false }: WorkflowStateNodeProps) {
  return (
    <div
      className={cn(
        "absolute h-[60px] w-[152px] rounded-md border bg-surface px-[11px] py-[9px]",
        selected
          ? "border-accent shadow-[0_0_0_2px_var(--color-accent-bg)]"
          : "border-line-2 shadow-[0_1px_2px_rgba(17,24,39,.05)]",
      )}
      style={{ left: state.position.x, top: state.position.y }}
      aria-selected={selected}
    >
      <div className={cn("absolute top-2 bottom-2 left-0 w-[3px] rounded-r-[2px]", TONE_STRIPE[state.tone])} />
      <div className="mb-[3px] text-tiny font-semibold tracking-[.02em] text-muted uppercase">{state.kind}</div>
      <div className="text-body-sm/[1.25] font-medium text-ink">{state.name}</div>
    </div>
  );
}
