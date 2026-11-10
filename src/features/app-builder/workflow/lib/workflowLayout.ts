import type { Point, WorkflowDiagram, WorkflowState, WorkflowTransition } from "../types";

// Fase 2 del workflow - Emiliano Carrizales: geometría del diagrama. Acomoda los estados en columnas (orden del
// proceso) y filas (desvíos abajo) y traza cada transición rodeando los estados. Todo es puro.

export const NODE_SIZE = { width: 152, height: 60 };
// 270: deja ~118 px entre estados para etiquetas como «responder con plan».
const COLUMN_GAP = 270;
const ROW_GAP = 150;
const ORIGIN = { x: 22, y: 20 };
const MARGIN = 40;
export const GRID = 10;

type Node = Pick<WorkflowState, "id" | "position"> & { kind?: string };
type Geometry = Pick<WorkflowTransition, "path" | "labelPosition" | "labelAnchor">;

const snap = (value: number) => Math.round(value / GRID) * GRID;
export const snapPoint = (point: Point): Point => ({ x: Math.max(0, snap(point.x)), y: Math.max(0, snap(point.y)) });

/** ¿Hay otro estado en la misma fila entre los dos? (entonces la flecha recta los atravesaría). */
function blockedRow(from: Node, to: Node, nodes: readonly Node[]) {
  const [left, right] = from.position.x < to.position.x ? [from, to] : [to, from];
  return nodes.some(
    (node) =>
      node.id !== from.id &&
      node.id !== to.id &&
      Math.abs(node.position.y - from.position.y) < NODE_SIZE.height &&
      node.position.x > left.position.x &&
      node.position.x < right.position.x,
  );
}

/**
 * Trazo de una transición. Hacia el estado de la derecha en la misma fila: recta. Hacia atrás o saltando estados:
 * por debajo de la fila, en un carril (`lane`) para que dos regresos no se encimen. Entre filas: en codo, por un
 * lado distinto según suba o baje, para que ida y vuelta no compartan la línea.
 */
export function routeTransition(from: Node, to: Node, nodes: readonly Node[] = [], lane = 0): Geometry {
  const a = from.position;
  const b = to.position;
  const sameRow = Math.abs(a.y - b.y) < NODE_SIZE.height / 2;

  if (sameRow && b.x > a.x && !blockedRow(from, to, nodes)) {
    const x1 = a.x + NODE_SIZE.width + 2;
    const x2 = b.x - 8;
    const y = a.y + NODE_SIZE.height / 2;
    return {
      path: `M${x1} ${y} L${x2} ${y}`,
      labelPosition: { x: (x1 + x2) / 2, y: y - 8 },
      labelAnchor: "middle",
    };
  }

  if (sameRow) {
    const laneY = Math.max(a.y, b.y) + NODE_SIZE.height + 18 + (lane % 6) * 12;
    const x1 = a.x + 96;
    const x2 = b.x + 56;
    return {
      path: `M${x1} ${a.y + NODE_SIZE.height + 2} L${x1} ${laneY} L${x2} ${laneY} L${x2} ${b.y + NODE_SIZE.height + 8}`,
      labelPosition: { x: (x1 + x2) / 2, y: laneY - 4 },
      labelAnchor: "middle",
    };
  }

  const down = b.y > a.y;
  // Sale por la izquierda del centro al bajar y por la derecha al subir (ida y vuelta no comparten línea); entra por
  // el lado del que viene.
  const x1 = a.x + (down ? 60 : 92);
  const x2 = b.x + (a.x > b.x + GRID ? 124 : a.x < b.x - GRID ? 28 : down ? 60 : 92);
  const y1 = down ? a.y + NODE_SIZE.height + 2 : a.y - 2;
  const y2 = down ? b.y - 8 : b.y + NODE_SIZE.height + 8;
  const middle = Math.round((y1 + y2) / 2);
  return {
    path: x1 === x2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} L${x1} ${middle} L${x2} ${middle} L${x2} ${y2}`,
    // La etiqueta va del lado de la línea vertical de llegada: a la izquierda si baja, a la derecha si sube.
    labelPosition: down ? { x: x2 - 6, y: middle + 14 } : { x: x2 + 8, y: middle - 6 },
    labelAnchor: down ? "end" : "start",
  };
}

/** Todos los estados que se dibujan (reales y sugeridos), para trazar y para no encimar. */
function nodesOf(diagram: Pick<WorkflowDiagram, "states" | "suggestedStates">): Node[] {
  return [...diagram.states, ...diagram.suggestedStates];
}

/** Vuelve a trazar las transiciones indicadas (o todas), asignando carriles a los regresos de cada fila. */
export function rerouteTransitions(diagram: WorkflowDiagram, only?: ReadonlySet<string>): WorkflowDiagram {
  const nodes = nodesOf(diagram);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const lanes = new Map<number, number>();
  const transitions = diagram.transitions.map((transition) => {
    const from = byId.get(transition.from);
    const to = byId.get(transition.to);
    if (!from || !to) return transition;
    const sameRow = Math.abs(from.position.y - to.position.y) < NODE_SIZE.height / 2;
    const forward = sameRow && to.position.x > from.position.x && !blockedRow(from, to, nodes);
    const row = Math.max(from.position.y, to.position.y);
    const lane = sameRow && !forward ? (lanes.get(row) ?? 0) : 0;
    if (sameRow && !forward) lanes.set(row, lane + 1);
    if (only && !only.has(transition.from) && !only.has(transition.to)) return transition;
    return { ...transition, ...routeTransition(from, to, nodes, lane) };
  });
  return fitCanvas({ ...diagram, transitions });
}

/** El lienzo crece para que quepan todos los estados (y nunca queda más chico que la plantilla). */
export function fitCanvas(diagram: WorkflowDiagram): WorkflowDiagram {
  const nodes = nodesOf(diagram);
  const width = Math.max(640, ...nodes.map((node) => node.position.x + NODE_SIZE.width + MARGIN));
  const height = Math.max(260, ...nodes.map((node) => node.position.y + NODE_SIZE.height + ROW_GAP / 2 + MARGIN));
  if (width === diagram.size.width && height === diagram.size.height) return diagram;
  return { ...diagram, size: { width, height } };
}

/** Primer lugar libre de la cuadrícula del acomodo, para un estado nuevo. */
export function freeSlot(diagram: Pick<WorkflowDiagram, "states" | "suggestedStates">, preferredRow = 0): Point {
  const taken = (point: Point) =>
    nodesOf(diagram).some(
      (node) =>
        Math.abs(node.position.x - point.x) < NODE_SIZE.width + 20 &&
        Math.abs(node.position.y - point.y) < NODE_SIZE.height + 20,
    );
  for (let row = preferredRow; row < preferredRow + 6; row++) {
    for (let column = 0; column < 12; column++) {
      const point = { x: ORIGIN.x + column * COLUMN_GAP, y: ORIGIN.y + row * ROW_GAP };
      if (!taken(point)) return point;
    }
  }
  return { x: ORIGIN.x, y: ORIGIN.y + (preferredRow + 6) * ROW_GAP };
}

/**
 * Acomodo automático: columna = en qué paso del proceso está el estado (desde el inicial); los estados de
 * "Retorno" y los finales alternos bajan a otra fila, debajo de quien los manda ahí.
 */
export function autoLayout(diagram: WorkflowDiagram): WorkflowDiagram {
  const { states } = diagram;
  if (states.length === 0) return diagram;
  const real = diagram.transitions.filter((transition) => transition.variant !== "suggested");
  const kindOf = new Map(states.map((state) => [state.id, state.kind]));
  const isDetour = (id: string) => kindOf.get(id) === "Retorno";

  // Columna por recorrido en anchura desde el inicial, sin seguir los desvíos ni regresar.
  const initial = states.find((state) => state.kind === "Inicial") ?? states[0];
  const column = new Map<string, number>([[initial.id, 0]]);
  const queue = [initial.id];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const transition of real) {
      if (transition.from !== current || column.has(transition.to) || isDetour(transition.to)) continue;
      column.set(transition.to, (column.get(current) ?? 0) + 1);
      queue.push(transition.to);
    }
  }
  // Desvíos: en la columna de quien los manda ahí. Lo que quede suelto, al final.
  for (const state of states) {
    if (column.has(state.id)) continue;
    const sender = real.find((transition) => transition.to === state.id && column.has(transition.from));
    column.set(state.id, sender ? (column.get(sender.from) as number) : Math.max(0, ...column.values()) + 1);
  }

  // La fila principal tiene un estado por columna; los demás (desvíos, finales alternos) bajan.
  const occupied = new Set<string>();
  const positions = new Map<string, Point>();
  const ordered = [...states].sort(
    (a, b) => Number(isDetour(a.id)) - Number(isDetour(b.id)) || (column.get(a.id) ?? 0) - (column.get(b.id) ?? 0),
  );
  for (const state of ordered) {
    const col = column.get(state.id) ?? 0;
    let row = isDetour(state.id) ? 1 : 0;
    while (occupied.has(`${col}:${row}`)) row++;
    occupied.add(`${col}:${row}`);
    positions.set(state.id, { x: ORIGIN.x + col * COLUMN_GAP, y: ORIGIN.y + row * ROW_GAP });
  }

  const laidOut: WorkflowDiagram = {
    ...diagram,
    states: states.map((state) => ({ ...state, position: positions.get(state.id) ?? state.position })),
    // Lo sugerido por el diseño queda debajo de todo para no encimarse.
    suggestedStates: diagram.suggestedStates.map((state, index) => ({
      ...state,
      position: {
        x: ORIGIN.x + index * COLUMN_GAP,
        y: ORIGIN.y + (Math.max(1, ...[...occupied].map((key) => Number(key.split(":")[1]))) + 1) * ROW_GAP,
      },
    })),
    annotations: [],
  };
  return rerouteTransitions(laidOut);
}
