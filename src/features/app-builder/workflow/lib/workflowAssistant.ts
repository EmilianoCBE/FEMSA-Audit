import type { CanvasWarning, Point, WorkflowDiagram, WorkflowState, WorkflowTransition } from "../types";

/**
 * US16 / US17 en el workflow: reglas deterministas (sin IA) que revisan el ciclo de vida y proponen cambios.
 * Todo es función pura: las reglas solo proponen; `applyWorkflowChange` aplica un cambio cuando el usuario lo acepta.
 */

/** Roles que pueden ejecutar una transición (los mismos que usa la configuración de transiciones). */
export const WORKFLOW_ROLES = [
  "Auditor",
  "Jefe de Auditoría",
  "Dirección de Auditoría",
  "Responsable del área",
] as const;

export type WorkflowChange =
  | { op: "set-transition-role"; transitionId: string; role: string }
  | { op: "add-transition"; from: string; to: string; label: string; role: string }
  | { op: "remove-transition"; transitionId: string };

export type WorkflowRuleId =
  | "unreachable-state"
  | "dead-end-state"
  | "missing-final-state"
  | "transition-without-role"
  | "duplicate-transition";

export type WorkflowSuggestion = {
  id: string;
  rule: WorkflowRuleId;
  title: string;
  /** Explicación obligatoria (RNF-12). */
  reason: string;
  /** Estado o transición al que se refiere, para marcarlo en el diagrama. */
  target: { type: "state" | "transition"; id: string } | null;
  /** Sin `change` la sugerencia solo informa: el usuario la corrige a mano. */
  change?: WorkflowChange;
};

const NODE_SIZE = { width: 152, height: 60 };

const isInitial = (state: WorkflowState) => state.kind === "Inicial";
const isFinal = (state: WorkflowState) => state.kind === "Final";

/** Transiciones reales: las sugeridas por el diseño no cuentan hasta que se acepten. */
function realTransitions(diagram: WorkflowDiagram) {
  const ids = new Set(diagram.states.map((state) => state.id));
  return diagram.transitions.filter(
    (transition) => transition.variant !== "suggested" && ids.has(transition.from) && ids.has(transition.to),
  );
}

/** Rol que se propone según el paso: avanzar lo hace el auditor; aprobar y cerrar, quien valida. */
export function proposeRole(diagram: WorkflowDiagram, from: string, to: string): string {
  const target = diagram.states.find((state) => state.id === to);
  const origin = diagram.states.find((state) => state.id === from);
  if (target && isFinal(target)) return "Dirección de Auditoría";
  if (target?.kind === "Aprobación") return "Jefe de Auditoría";
  if (origin?.kind === "Retorno") return "Jefe de Auditoría";
  return "Auditor";
}

const stateName = (diagram: WorkflowDiagram, id: string) => diagram.states.find((state) => state.id === id)?.name ?? id;

export function analyzeWorkflow(diagram: WorkflowDiagram): WorkflowSuggestion[] {
  const transitions = realTransitions(diagram);
  const suggestions: WorkflowSuggestion[] = [];
  const initial = diagram.states.find(isInitial);
  const finals = diagram.states.filter(isFinal);

  if (diagram.states.length > 0 && finals.length === 0) {
    suggestions.push({
      id: "missing-final-state",
      rule: "missing-final-state",
      title: "El flujo no tiene estado final",
      reason: "Ningún estado cierra el hallazgo, así que nunca podría terminar. Marca uno como «Final».",
      target: null,
    });
  }

  for (const state of diagram.states) {
    if (!isInitial(state) && !transitions.some((transition) => transition.to === state.id)) {
      suggestions.push({
        id: `unreachable-state:${state.id}`,
        rule: "unreachable-state",
        title: `«${state.name}» es inalcanzable`,
        reason: "Ninguna transición llega a este estado, así que un hallazgo nunca podría estar en él.",
        target: { type: "state", id: state.id },
        ...(initial && {
          change: {
            op: "add-transition",
            from: initial.id,
            to: state.id,
            label: "mover",
            role: proposeRole(diagram, initial.id, state.id),
          },
        }),
      });
    }
    if (!isFinal(state) && !transitions.some((transition) => transition.from === state.id)) {
      const closing = finals[0];
      suggestions.push({
        id: `dead-end-state:${state.id}`,
        rule: "dead-end-state",
        title: `«${state.name}» no tiene salida`,
        reason:
          "No es un estado final y ninguna transición sale de él: un hallazgo que llegue aquí se quedaría atorado.",
        target: { type: "state", id: state.id },
        ...(closing && {
          change: {
            op: "add-transition",
            from: state.id,
            to: closing.id,
            label: "cerrar",
            role: proposeRole(diagram, state.id, closing.id),
          },
        }),
      });
    }
  }

  const seen = new Map<string, WorkflowTransition>();
  for (const transition of transitions) {
    const key = `${transition.from}→${transition.to}→${transition.label.trim().toLowerCase()}`;
    const original = seen.get(key);
    if (original) {
      suggestions.push({
        id: `duplicate-transition:${transition.id}`,
        rule: "duplicate-transition",
        title: `Transición «${transition.label}» duplicada`,
        reason: `Ya existe «${original.label}» de ${stateName(diagram, transition.from)} a ${stateName(diagram, transition.to)}; tener dos iguales hace ambiguo quién mueve el hallazgo.`,
        target: { type: "transition", id: transition.id },
        change: { op: "remove-transition", transitionId: transition.id },
      });
    } else {
      seen.set(key, transition);
    }

    if (!transition.role) {
      suggestions.push({
        id: `transition-without-role:${transition.id}`,
        rule: "transition-without-role",
        title: `«${transition.label}» no tiene rol asignado`,
        reason: `Nadie tiene permiso para mover el hallazgo de ${stateName(diagram, transition.from)} a ${stateName(diagram, transition.to)}; la transición no se podría ejecutar.`,
        target: { type: "transition", id: transition.id },
        change: {
          op: "set-transition-role",
          transitionId: transition.id,
          role: proposeRole(diagram, transition.from, transition.to),
        },
      });
    }
  }

  return suggestions;
}

/** Trazo recto entre dos estados: por el lado que los separa. */
function pathBetween(from: WorkflowState, to: WorkflowState): { path: string; labelPosition: Point } {
  const a = from.position;
  const b = to.position;
  if (a.y === b.y) {
    const right = b.x > a.x;
    const x1 = right ? a.x + NODE_SIZE.width + 2 : a.x - 2;
    const x2 = right ? b.x - 8 : b.x + NODE_SIZE.width + 8;
    const y = a.y + NODE_SIZE.height / 2;
    return { path: `M${x1} ${y} L${x2} ${y}`, labelPosition: { x: (x1 + x2) / 2, y: y - 8 } };
  }
  const down = b.y > a.y;
  const x1 = a.x + NODE_SIZE.width / 2;
  const x2 = b.x + NODE_SIZE.width / 2;
  const y1 = down ? a.y + NODE_SIZE.height + 2 : a.y - 2;
  const y2 = down ? b.y - 8 : b.y + NODE_SIZE.height + 8;
  return {
    path:
      x1 === x2
        ? `M${x1} ${y1} L${x2} ${y2}`
        : `M${x1} ${y1} L${x1} ${(y1 + y2) / 2} L${x2} ${(y1 + y2) / 2} L${x2} ${y2}`,
    labelPosition: { x: x2 + 8, y: (y1 + y2) / 2 - 6 },
  };
}

/** Aplica un cambio aceptado; devuelve el mismo diagrama si el cambio ya no corresponde (p. ej. el estado se borró). */
export function applyWorkflowChange(diagram: WorkflowDiagram, change: WorkflowChange): WorkflowDiagram {
  switch (change.op) {
    case "set-transition-role": {
      if (!diagram.transitions.some((transition) => transition.id === change.transitionId)) return diagram;
      return {
        ...diagram,
        transitions: diagram.transitions.map((transition) =>
          transition.id === change.transitionId ? { ...transition, role: change.role } : transition,
        ),
      };
    }
    case "remove-transition": {
      if (!diagram.transitions.some((transition) => transition.id === change.transitionId)) return diagram;
      return {
        ...diagram,
        transitions: diagram.transitions.filter((transition) => transition.id !== change.transitionId),
      };
    }
    case "add-transition": {
      const from = diagram.states.find((state) => state.id === change.from);
      const to = diagram.states.find((state) => state.id === change.to);
      if (!from || !to || from.id === to.id) return diagram;
      const ids = new Set(diagram.transitions.map((transition) => transition.id));
      let id = `${change.from}-${change.to}`;
      for (let n = 2; ids.has(id); n++) id = `${change.from}-${change.to}-${n}`;
      return {
        ...diagram,
        transitions: [
          ...diagram.transitions,
          {
            id,
            label: change.label,
            from: from.id,
            to: to.id,
            role: change.role,
            variant: "default",
            labelAnchor: "start",
            ...pathBetween(from, to),
          },
        ],
      };
    }
  }
}

/** Punto a la mitad del recorrido de un trazo de líneas rectas ("M x y L x y ..."). */
export function pathMidpoint(path: string): Point | null {
  const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const points: Point[] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) points.push({ x: numbers[i], y: numbers[i + 1] });
  if (points.length < 2) return null;
  const lengths = points.slice(1).map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const t = remaining / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}

/** La marca mide 16 px: se centra en el punto. */
const centered = (point: Point): Point => ({ x: point.x - 8, y: point.y - 8 });

/** Marcas "!" del diagrama a partir de las sugerencias pendientes. */
export function suggestionWarnings(
  diagram: WorkflowDiagram,
  suggestions: readonly WorkflowSuggestion[],
): CanvasWarning[] {
  return suggestions.flatMap((suggestion) => {
    if (suggestion.target?.type === "state") {
      const state = diagram.states.find((item) => item.id === suggestion.target?.id);
      if (!state) return [];
      return [
        {
          id: suggestion.id,
          message: suggestion.title,
          position: { x: state.position.x + NODE_SIZE.width - 10, y: state.position.y - 6 },
        },
      ];
    }
    if (suggestion.target?.type === "transition") {
      const transition = diagram.transitions.find((item) => item.id === suggestion.target?.id);
      if (!transition) return [];
      return [
        {
          id: suggestion.id,
          message: suggestion.title,
          position: centered(pathMidpoint(transition.path) ?? transition.labelPosition),
        },
      ];
    }
    return [];
  });
}

/** Texto del cambio propuesto, para mostrarlo antes de aceptarlo. */
export function describeWorkflowChange(diagram: WorkflowDiagram, change: WorkflowChange): string {
  const label = (id: string) => diagram.transitions.find((transition) => transition.id === id)?.label ?? id;
  switch (change.op) {
    case "set-transition-role":
      return `asignar el rol «${change.role}» a «${label(change.transitionId)}»`;
    case "remove-transition":
      return `quitar la transición repetida «${label(change.transitionId)}»`;
    case "add-transition":
      return `agregar «${change.label}» de ${stateName(diagram, change.from)} a ${stateName(diagram, change.to)} (rol ${change.role})`;
  }
}
