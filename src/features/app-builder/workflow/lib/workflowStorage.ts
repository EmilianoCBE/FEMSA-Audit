import { findingLifecycleMock } from "../data/workflow.mock";
import type { StoredWorkflow, WorkflowDiagram, WorkflowState } from "../types";
import { pathBetween } from "./workflowAssistant";

// Fase 1 del workflow - Emiliano Carrizales: el flujo se guarda con cada formulario (layout del Designer) y entra
// en AppVersions.config.workflow al guardar una versión. Aquí se convierte entre lo que se dibuja y lo que se guarda.

export function toStoredWorkflow(diagram: WorkflowDiagram): StoredWorkflow {
  const { warnings: _warnings, selectedStateId: _selected, ...stored } = diagram;
  return structuredClone(stored);
}

/** Plantilla base para un formulario que todavía no tiene flujo guardado: el ciclo de vida típico del hallazgo. */
export const DEFAULT_WORKFLOW: StoredWorkflow = toStoredWorkflow(findingLifecycleMock);

export function fromStoredWorkflow(stored: StoredWorkflow | null | undefined): WorkflowDiagram {
  const workflow = structuredClone(stored ?? DEFAULT_WORKFLOW);
  // Estados reales y sugeridos, para trazar las transiciones que no traen su trazo guardado.
  const nodes = new Map<string, WorkflowState>([
    ...workflow.suggestedStates.map((state) => [state.id, { ...state, tone: "neutral" as const }] as const),
    ...workflow.states.map((state) => [state.id, state] as const),
  ]);
  const transitions = workflow.transitions.map((transition) => {
    if (transition.path && transition.labelPosition) {
      return { ...transition, path: transition.path, labelPosition: transition.labelPosition };
    }
    const from = nodes.get(transition.from);
    const to = nodes.get(transition.to);
    const geometry = from && to ? pathBetween(from, to) : { path: "", labelPosition: { x: 0, y: 0 } };
    return { ...transition, ...geometry };
  });
  return { ...workflow, transitions, warnings: [] };
}

const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value)
          .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
          .join(",")}}`
      : JSON.stringify(value ?? null);

/** Mismo flujo aunque cambie el orden de las llaves (para saber si hay cambios sin guardar). */
export const sameWorkflow = (a: StoredWorkflow | null | undefined, b: StoredWorkflow | null | undefined) =>
  canonical(a ?? null) === canonical(b ?? null);

/** Resumen legible de lo que cambió en el flujo entre dos versiones (para comparar y para "Cambios de esta versión"). */
export function describeWorkflowChanges(
  before: StoredWorkflow | null | undefined,
  after: StoredWorkflow | null | undefined,
): string[] {
  if (sameWorkflow(before, after)) return [];
  if (!before) return ["Se guardó el flujo del proceso"];
  if (!after) return ["Se quitó el flujo del proceso"];

  const changes: string[] = [];
  const beforeStates = new Map(before.states.map((state) => [state.id, state]));
  const afterStates = new Map(after.states.map((state) => [state.id, state]));
  for (const state of after.states)
    if (!beforeStates.has(state.id)) changes.push(`Se agregó el estado «${state.name}»`);
  for (const state of before.states) if (!afterStates.has(state.id)) changes.push(`Se quitó el estado «${state.name}»`);
  for (const state of after.states) {
    const previous = beforeStates.get(state.id);
    if (previous && (previous.name !== state.name || previous.kind !== state.kind)) {
      changes.push(`Se modificó el estado «${state.name}»`);
    }
  }

  const name = (workflow: StoredWorkflow, id: string) => workflow.states.find((state) => state.id === id)?.name ?? id;
  const beforeTransitions = new Map(before.transitions.map((transition) => [transition.id, transition]));
  const afterTransitions = new Map(after.transitions.map((transition) => [transition.id, transition]));
  for (const transition of after.transitions) {
    const previous = beforeTransitions.get(transition.id);
    if (!previous) {
      changes.push(
        `Se agregó la transición «${transition.label}» de ${name(after, transition.from)} a ${name(after, transition.to)}`,
      );
    } else if (previous.role !== transition.role) {
      changes.push(`La transición «${transition.label}» ahora la ejecuta ${transition.role ?? "nadie"}`);
    } else if (
      previous.label !== transition.label ||
      previous.from !== transition.from ||
      previous.to !== transition.to
    ) {
      changes.push(`Se modificó la transición «${transition.label}»`);
    }
  }
  for (const transition of before.transitions) {
    if (!afterTransitions.has(transition.id)) changes.push(`Se quitó la transición «${transition.label}»`);
  }
  return changes.length ? changes : ["Se reacomodó el diagrama del flujo"];
}
