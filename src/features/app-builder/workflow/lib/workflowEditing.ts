import type { Point, StateTone, TransitionRequirements, WorkflowDiagram, WorkflowTransition } from "../types";
import { applyWorkflowChange, proposeRole, type WorkflowChange } from "./workflowAssistant";
import { autoLayout, fitCanvas, freeSlot, rerouteTransitions, snapPoint } from "./workflowLayout";

// Fase 2 del workflow - Emiliano Carrizales: edición manual del flujo (estados, transiciones, roles y requisitos).
// Cada edición es una función pura sobre el diagrama, igual que los cambios que propone el asistente.

/** Tipos de estado (los mismos que acepta la IA al generar un flujo). */
export const STATE_KINDS = ["Inicial", "En proceso", "Aprobación", "Retorno", "Final"] as const;
export type StateKind = (typeof STATE_KINDS)[number];

export const STATE_KIND_HELP: Record<StateKind, string> = {
  Inicial: "Donde nace el hallazgo (solo debe haber uno).",
  "En proceso": "Alguien trabaja el hallazgo: documentar, responder, remediar.",
  Aprobación: "Alguien con autoridad revisa y aprueba o devuelve.",
  Retorno: "A donde llega un hallazgo devuelto o rechazado.",
  Final: "El hallazgo termina aquí (cerrado, riesgo aceptado…).",
};

export const TONE_BY_KIND: Record<string, StateTone> = {
  Inicial: "neutral",
  "En proceso": "amber",
  Aprobación: "accent",
  Retorno: "red",
  Final: "green",
};

/** Los mismos topes que acepta la IA (30 estados, 60 transiciones), por debajo de lo que guarda el back. */
export const LIMITS = { states: 30, transitions: 60 } as const;

export const REQUIREMENTS: readonly { id: keyof TransitionRequirements; label: string; help: string }[] = [
  { id: "evidence", label: "Evidencia adjunta", help: "No se puede ejecutar sin al menos una evidencia." },
  { id: "comment", label: "Comentario obligatorio", help: "Quien la ejecuta debe explicar por qué." },
  { id: "actionPlan", label: "Plan de acción", help: "Debe existir un plan con responsable y fecha compromiso." },
];

export type WorkflowEdit =
  | WorkflowChange
  | { op: "add-state"; name: string; kind: StateKind; position?: Point }
  | { op: "update-state"; stateId: string; name?: string; kind?: StateKind; slaDays?: number | null }
  | { op: "remove-state"; stateId: string }
  | { op: "move-state"; stateId: string; position: Point }
  | {
      op: "update-transition";
      transitionId: string;
      label?: string;
      from?: string;
      to?: string;
      role?: string | null;
    }
  | { op: "accept-suggested-state"; stateId: string; kind: StateKind }
  | { op: "remove-suggested-state"; stateId: string }
  | { op: "auto-layout" }
  | { op: "replace-all"; diagram: WorkflowDiagram };

/** Id legible a partir del nombre ("Validación dirección" → "validacion-direccion"), sin repetir. */
export function slugId(name: string, taken: Iterable<string>): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "estado";
  const used = new Set(taken);
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
}

/** Id que tendrá un estado nuevo con ese nombre (sirve para seleccionarlo justo después de agregarlo). */
export const newStateId = (diagram: Pick<WorkflowDiagram, "states" | "suggestedStates">, name: string) =>
  slugId(
    name,
    [...diagram.states, ...diagram.suggestedStates].map((state) => state.id),
  );

const normalized = (text: string) => text.trim().toLowerCase();

/** Mensaje de error del nombre de un estado, o `null` si sirve. */
export function stateNameError(diagram: WorkflowDiagram, name: string, exceptId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Escribe el nombre del estado.";
  if (trimmed.length > 80) return "El nombre puede tener hasta 80 caracteres.";
  const repeated = diagram.states.some((state) => state.id !== exceptId && normalized(state.name) === normalized(name));
  return repeated ? "Ya hay un estado con ese nombre." : null;
}

/** Mensaje de error de una transición, o `null` si sirve. */
export function transitionError(
  diagram: WorkflowDiagram,
  { from, to, label }: { from: string; to: string; label: string },
  exceptId?: string,
): string | null {
  if (!label.trim()) return "Escribe la acción (por ejemplo: aprobar, devolver).";
  if (label.trim().length > 60) return "La acción puede tener hasta 60 caracteres.";
  if (from === to) return "Una transición debe ir a otro estado.";
  const origin = diagram.states.find((state) => state.id === from);
  if (!origin || !diagram.states.some((state) => state.id === to)) return "Elige el estado de origen y el de destino.";
  if (origin.kind === "Final") return "De un estado final no sale ninguna transición.";
  const repeated = diagram.transitions.some(
    (transition) =>
      transition.id !== exceptId &&
      transition.variant !== "suggested" &&
      transition.from === from &&
      transition.to === to &&
      normalized(transition.label) === normalized(label),
  );
  return repeated ? "Ya existe esa misma transición." : null;
}

/** Variante visual según el destino: lo que llega a un "Retorno" se dibuja como rechazo. */
function variantFor(diagram: WorkflowDiagram, transition: WorkflowTransition): WorkflowTransition["variant"] {
  if (transition.variant === "suggested") return "suggested";
  const target = diagram.states.find((state) => state.id === transition.to);
  if (target?.kind === "Retorno") return "rejected";
  return transition.variant === "rejected" ? "default" : transition.variant;
}

const withVariants = (diagram: WorkflowDiagram): WorkflowDiagram => ({
  ...diagram,
  transitions: diagram.transitions.map((transition) => {
    const variant = variantFor(diagram, transition);
    return variant === transition.variant ? transition : { ...transition, variant };
  }),
});

/** Aplica una edición manual o un cambio del asistente. Si ya no corresponde (algo se borró), no cambia nada. */
export function applyWorkflowEdit(diagram: WorkflowDiagram, edit: WorkflowEdit): WorkflowDiagram {
  switch (edit.op) {
    case "add-state": {
      if (diagram.states.length >= LIMITS.states || stateNameError(diagram, edit.name)) return diagram;
      const id = newStateId(diagram, edit.name);
      const position = snapPoint(edit.position ?? freeSlot(diagram, edit.kind === "Retorno" ? 1 : 0));
      return fitCanvas({
        ...diagram,
        states: [
          ...diagram.states,
          { id, name: edit.name.trim(), kind: edit.kind, tone: TONE_BY_KIND[edit.kind], position },
        ],
      });
    }
    case "update-state": {
      const current = diagram.states.find((state) => state.id === edit.stateId);
      if (!current) return diagram;
      if (edit.name !== undefined && stateNameError(diagram, edit.name, edit.stateId)) return diagram;
      const { slaDays: _previous, ...rest } = current;
      const slaDays = edit.slaDays === undefined ? current.slaDays : (edit.slaDays ?? undefined);
      const updated = {
        ...rest,
        ...(edit.name !== undefined && { name: edit.name.trim() }),
        ...(edit.kind && { kind: edit.kind, tone: TONE_BY_KIND[edit.kind] }),
        ...(slaDays !== undefined && { slaDays }),
      };
      const next = { ...diagram, states: diagram.states.map((state) => (state.id === edit.stateId ? updated : state)) };
      // Si deja de ser intermedio y pasa a final, lo que salía de él ya no tiene sentido: se conserva, y las reglas
      // del asistente lo señalan (el usuario decide qué hacer).
      return withVariants(next);
    }
    case "remove-state": {
      if (!diagram.states.some((state) => state.id === edit.stateId)) return diagram;
      return fitCanvas({
        ...diagram,
        states: diagram.states.filter((state) => state.id !== edit.stateId),
        transitions: diagram.transitions.filter(
          (transition) => transition.from !== edit.stateId && transition.to !== edit.stateId,
        ),
        selectedStateId: diagram.selectedStateId === edit.stateId ? undefined : diagram.selectedStateId,
      });
    }
    case "move-state": {
      if (!diagram.states.some((state) => state.id === edit.stateId)) return diagram;
      const position = snapPoint(edit.position);
      const moved = {
        ...diagram,
        states: diagram.states.map((state) => (state.id === edit.stateId ? { ...state, position } : state)),
      };
      return rerouteTransitions(moved, new Set([edit.stateId]));
    }
    case "update-transition": {
      const current = diagram.transitions.find((transition) => transition.id === edit.transitionId);
      if (!current) return diagram;
      const from = edit.from ?? current.from;
      const to = edit.to ?? current.to;
      const label = edit.label ?? current.label;
      if (transitionError(diagram, { from, to, label }, current.id)) return diagram;
      const updated: WorkflowTransition = {
        ...current,
        from,
        to,
        label: label.trim(),
        ...(edit.role !== undefined && { role: edit.role }),
      };
      const next = withVariants({
        ...diagram,
        transitions: diagram.transitions.map((transition) => (transition.id === current.id ? updated : transition)),
      });
      return from === current.from && to === current.to ? next : rerouteTransitions(next, new Set([from, to]));
    }
    case "accept-suggested-state": {
      const suggested = diagram.suggestedStates.find((state) => state.id === edit.stateId);
      if (!suggested || diagram.states.length >= LIMITS.states) return diagram;
      const name = stateNameError(diagram, suggested.name) ? `${suggested.name} (nuevo)` : suggested.name;
      const states = [
        ...diagram.states,
        { id: suggested.id, name, kind: edit.kind, tone: TONE_BY_KIND[edit.kind], position: suggested.position },
      ];
      const next = {
        ...diagram,
        states,
        suggestedStates: diagram.suggestedStates.filter((s) => s.id !== suggested.id),
      };
      // Las transiciones sugeridas hacia ese estado pasan a ser reales, con el rol que corresponde.
      return withVariants({
        ...next,
        transitions: next.transitions.map((transition) =>
          transition.variant === "suggested" && (transition.to === suggested.id || transition.from === suggested.id)
            ? {
                ...transition,
                variant: "default",
                label: transition.label === "sugerida" ? "enviar" : transition.label,
                role: transition.role ?? proposeRole(next, transition.from, transition.to),
              }
            : transition,
        ),
      });
    }
    case "remove-suggested-state": {
      if (!diagram.suggestedStates.some((state) => state.id === edit.stateId)) return diagram;
      return {
        ...diagram,
        suggestedStates: diagram.suggestedStates.filter((state) => state.id !== edit.stateId),
        transitions: diagram.transitions.filter(
          (transition) => transition.to !== edit.stateId && transition.from !== edit.stateId,
        ),
        // La etiqueta de diseño que acompañaba a lo sugerido ya no aplica.
        annotations: diagram.annotations.filter((annotation) => !annotation.id.startsWith("suggested")),
      };
    }
    case "auto-layout":
      return autoLayout(diagram);
    case "replace-all":
      return edit.diagram;
    case "add-transition":
      if (diagram.transitions.length >= LIMITS.transitions) return diagram;
      return withVariants(applyWorkflowChange(diagram, edit));
    default:
      return applyWorkflowChange(diagram, edit);
  }
}

/** Estados que llegan a este y a los que se puede pasar desde él (US04: navegar predecesoras y sucesoras). */
export function neighbors(diagram: WorkflowDiagram, stateId: string) {
  const real = diagram.transitions.filter((transition) => transition.variant !== "suggested");
  const name = (id: string) => diagram.states.find((state) => state.id === id)?.name ?? id;
  return {
    incoming: real
      .filter((transition) => transition.to === stateId)
      .map((transition) => ({ transition, stateId: transition.from, stateName: name(transition.from) })),
    outgoing: real
      .filter((transition) => transition.from === stateId)
      .map((transition) => ({ transition, stateId: transition.to, stateName: name(transition.to) })),
  };
}
