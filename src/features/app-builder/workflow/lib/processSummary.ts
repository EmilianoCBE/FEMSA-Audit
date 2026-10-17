import type { Point, WorkflowDiagram, WorkflowRule, WorkflowState } from "../types";

/** Medidas del diagrama */
const NODE_SIZE = { width: 152, height: 60 };
const NODE_SNAP = 10;
const DIAGRAM_PADDING = 20;

export type ProcessBranch = {
  id: string;
  label: string;
  from: WorkflowState;
  to: WorkflowState;
  /** Regresa a un estado de la secuencia principal */
  returns: boolean;
};

/** El formulario tiene un flujo configurado */
export function hasFlow(diagram: WorkflowDiagram) {
  return diagram.states.length > 0;
}

/** Diagrama de solo lectura: sin sugerencias de la IA ni transición resaltada */
export function getReferenceDiagram(diagram: WorkflowDiagram) {
  const bottom = Math.max(0, ...diagram.states.map((state) => state.position.y + NODE_SIZE.height));
  return {
    size: { width: diagram.size.width, height: bottom + DIAGRAM_PADDING },
    states: diagram.states,
    transitions: diagram.transitions
      .filter((transition) => transition.variant !== "suggested")
      .map((transition) =>
        transition.variant === "active" ? { ...transition, variant: "default" as const } : transition,
      ),
  };
}

/** Secuencia principal: los estados de la fila superior, de izquierda a derecha */
export function getMainSequence({ states }: WorkflowDiagram) {
  const mainRow = Math.min(...states.map((state) => state.position.y));
  return states.filter((state) => state.position.y === mainRow).sort((a, b) => a.position.x - b.position.x);
}

/** Secuencia principal como texto: "Borrador → En revisión → …" */
export function getSequenceSummary(diagram: WorkflowDiagram) {
  return getMainSequence(diagram)
    .map((state) => state.name)
    .join(" → ");
}

/** Inicio y fin de una flecha */
function getPathEnds(path: string): [Point, Point] | null {
  const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 4) return null;
  return [
    { x: numbers[0], y: numbers[1] },
    { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] },
  ];
}

/** Estado en un punto */
function findStateAt(states: readonly WorkflowState[], point: Point) {
  return states.find(
    ({ position }) =>
      point.x >= position.x - NODE_SNAP &&
      point.x <= position.x + NODE_SIZE.width + NODE_SNAP &&
      point.y >= position.y - NODE_SNAP &&
      point.y <= position.y + NODE_SIZE.height + NODE_SNAP,
  );
}

/** Desvíos: transiciones que no avanzan al siguiente paso de la secuencia principal */
export function getBranches(diagram: WorkflowDiagram): ProcessBranch[] {
  const sequence = getMainSequence(diagram);
  return diagram.transitions.flatMap((transition) => {
    const ends = getPathEnds(transition.path);
    if (!ends) return [];
    const from = findStateAt(diagram.states, ends[0]);
    const to = findStateAt(diagram.states, ends[1]);
    if (!from || !to) return [];
    if (sequence.includes(from) && sequence.indexOf(to) === sequence.indexOf(from) + 1) return [];
    return [{ id: transition.id, label: transition.label, from, to, returns: sequence.includes(to) }];
  });
}

/** Reglas activas; aplican a pasos del flujo, así que sin flujo no hay */
export function getActiveRules(diagram: WorkflowDiagram, rules: readonly WorkflowRule[]) {
  return hasFlow(diagram) ? rules.filter((rule) => rule.active) : [];
}

/** Primera letra en minúscula para leer la regla como frase */
export function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
