import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import type { StateTone, WorkflowState } from "../../types";

const TONE_STRIPE: Record<StateTone, string> = {
  neutral: "bg-muted-2",
  amber: "bg-amber",
  accent: "bg-accent",
  green: "bg-green",
  red: "bg-red",
};

type WorkflowStateNodeProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onKeyDown"
> & {
  state: WorkflowState;
  selected?: boolean;
  /** Fase 2 (US04): se puede seleccionar con clic o teclado. */
  interactive?: boolean;
  /** Fase 2: se puede arrastrar (o mover con flechas) para acomodarlo. */
  draggable?: boolean;
};

export function WorkflowStateNode({
  state,
  selected = false,
  interactive = false,
  draggable = false,
  ...handlers
}: WorkflowStateNodeProps) {
  return (
    <div
      className={cn(
        "absolute h-[60px] w-[152px] rounded-md border bg-surface px-[11px] py-[9px] select-none",
        selected
          ? "border-accent shadow-[0_0_0_2px_var(--color-accent-bg)]"
          : "border-line-2 shadow-[0_1px_2px_rgba(17,24,39,.05)]",
        interactive && "cursor-pointer focus-visible:outline-2 focus-visible:outline-accent",
        draggable && "cursor-grab touch-none active:cursor-grabbing",
      )}
      style={{ left: state.position.x, top: state.position.y }}
      {...(interactive
        ? {
            role: "button",
            tabIndex: 0,
            "aria-pressed": selected,
            "aria-label": `Estado ${state.name} (${state.kind})`,
            ...handlers,
          }
        : { "aria-selected": selected })}
    >
      <div className={cn("absolute top-2 bottom-2 left-0 w-[3px] rounded-r-[2px]", TONE_STRIPE[state.tone])} />
      <div className="mb-[3px] text-tiny font-semibold tracking-[.02em] text-muted uppercase">
        {state.kind}
        {state.slaDays ? <span className="ml-1 font-normal normal-case">· {state.slaDays} d</span> : null}
      </div>
      <div className="text-body-sm/[1.25] font-medium text-ink">{state.name}</div>
    </div>
  );
}
