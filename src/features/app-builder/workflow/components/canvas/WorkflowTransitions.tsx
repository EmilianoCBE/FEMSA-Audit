import { useId } from "react";
import { cn } from "@/shared/lib/cn";
import type { TransitionVariant, WorkflowDiagram } from "../../types";

type VariantStyle = {
  path: string;
  label: string;
  arrow: string;
};

/** Estilo visual por tipo de transición. Un nuevo tipo solo requiere una entrada aquí. */
const VARIANT_STYLES: Record<TransitionVariant, VariantStyle> = {
  default: {
    path: "stroke-muted-2 [stroke-width:1.4]",
    label: "fill-muted",
    arrow: "stroke-muted-2 [stroke-width:1.6]",
  },
  active: {
    path: "stroke-accent [stroke-width:1.8]",
    label: "fill-accent font-medium",
    arrow: "stroke-accent [stroke-width:1.8]",
  },
  rejected: {
    path: "stroke-red-soft [stroke-width:1.4] [stroke-dasharray:4_3]",
    label: "fill-red",
    arrow: "stroke-red-soft [stroke-width:1.6]",
  },
  suggested: {
    path: "stroke-accent-line [stroke-width:1.4] [stroke-dasharray:5_4]",
    label: "fill-accent",
    arrow: "stroke-accent-line [stroke-width:1.6]",
  },
};

const VARIANTS = Object.keys(VARIANT_STYLES) as TransitionVariant[];

type WorkflowTransitionsProps = Pick<WorkflowDiagram, "size" | "transitions"> & {
  /** Fase 2: la transición elegida se resalta; con `onSelect` se puede elegir con un clic. */
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function WorkflowTransitions({ size, transitions, selectedId, onSelect }: WorkflowTransitionsProps) {
  const markerPrefix = useId();
  const markerId = (variant: TransitionVariant) => `${markerPrefix}-arrow-${variant}`;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden
    >
      <defs>
        {VARIANTS.map((variant) => (
          <marker
            key={variant}
            id={markerId(variant)}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M1.5 1.5L9 5L1.5 8.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={VARIANT_STYLES[variant].arrow}
            />
          </marker>
        ))}
      </defs>
      {transitions.map((transition) => {
        const selected = transition.id === selectedId;
        const variant = selected ? "active" : transition.variant;
        const style = VARIANT_STYLES[variant];
        const select = onSelect && transition.variant !== "suggested" ? () => onSelect(transition.id) : undefined;
        return (
          <g
            key={transition.id}
            data-transition={transition.id}
            className={cn(select && "pointer-events-auto cursor-pointer")}
            onPointerDown={select && ((event) => event.stopPropagation())}
            onClick={select}
          >
            {/* Área de clic más ancha que la línea (invisible). */}
            {select && <path d={transition.path} fill="none" stroke="transparent" strokeWidth={12} />}
            <path
              d={transition.path}
              fill="none"
              className={cn(style.path, selected && "[stroke-width:2.4]")}
              markerEnd={`url(#${markerId(variant)})`}
            />
            <text
              x={transition.labelPosition.x}
              y={transition.labelPosition.y}
              textAnchor={transition.labelAnchor ?? "start"}
              className={cn(
                "font-sans text-caption stroke-surface [stroke-width:3px] [paint-order:stroke]",
                style.label,
              )}
            >
              {transition.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
