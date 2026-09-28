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
  default: { path: "stroke-muted-2 [stroke-width:1.4]", label: "fill-muted", arrow: "stroke-muted-2 [stroke-width:1.6]" },
  active: { path: "stroke-accent [stroke-width:1.8]", label: "fill-accent font-medium", arrow: "stroke-accent [stroke-width:1.8]" },
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

type WorkflowTransitionsProps = Pick<WorkflowDiagram, "size" | "transitions">;

export function WorkflowTransitions({ size, transitions }: WorkflowTransitionsProps) {
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
        const style = VARIANT_STYLES[transition.variant];
        return (
          <g key={transition.id}>
            <path d={transition.path} fill="none" className={style.path} markerEnd={`url(#${markerId(transition.variant)})`} />
            <text
              x={transition.labelPosition.x}
              y={transition.labelPosition.y}
              textAnchor={transition.labelAnchor ?? "start"}
              className={cn("font-sans text-caption", style.label)}
            >
              {transition.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
