export type Point = { x: number; y: number };

/* ---------- Diagrama ---------- */

export type StateTone = "neutral" | "amber" | "accent" | "green" | "red";

/** Estado del ciclo de vida del hallazgo (nodo del diagrama). */
export type WorkflowState = {
  id: string;
  kind: string;
  name: string;
  tone: StateTone;
  position: Point;
};

export type TransitionVariant = "default" | "active" | "rejected" | "suggested";

/** Transición entre estados (arista del diagrama). */
export type WorkflowTransition = {
  id: string;
  label: string;
  /** Estado de origen y de destino (id de `WorkflowState`). Las sugeridas pueden apuntar a un `SuggestedState`. */
  from: string;
  to: string;
  /** Rol que puede ejecutarla; `null` si nadie la tiene asignada. */
  role: string | null;
  /** Trazo SVG ya enrutado dentro del canvas. */
  path: string;
  labelPosition: Point;
  labelAnchor?: "start" | "middle";
  variant: TransitionVariant;
};

export type CanvasWarning = {
  id: string;
  message: string;
  position: Point;
};

export type SuggestedState = {
  id: string;
  kind: string;
  name: string;
  position: Point;
};

export type CanvasAnnotation = {
  id: string;
  label: string;
  position: Point;
};

export type WorkflowDiagram = {
  size: { width: number; height: number };
  states: readonly WorkflowState[];
  transitions: readonly WorkflowTransition[];
  warnings: readonly CanvasWarning[];
  suggestedStates: readonly SuggestedState[];
  annotations: readonly CanvasAnnotation[];
  selectedStateId?: string;
};

/**
 * Lo que se guarda del flujo de cada formulario (layout del Designer y AppVersions.config.workflow).
 * Las marcas de advertencia y la selección no se guardan: se calculan en pantalla.
 */
export type StoredWorkflow = Omit<WorkflowDiagram, "warnings" | "selectedStateId" | "transitions"> & {
  /** El trazo es opcional: si falta, se calcula entre los dos estados al cargar. */
  transitions: readonly (Omit<WorkflowTransition, "path" | "labelPosition"> &
    Partial<Pick<WorkflowTransition, "path" | "labelPosition">>)[];
};

/* ---------- Inspector ---------- */

export type ToggleOption = {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
};

export type TransitionSettings = {
  title: string;
  permissions: readonly { label: string; value: string }[];
  preconditions: readonly ToggleOption[];
  automations: readonly ToggleOption[];
};

/* ---------- Tablas ---------- */

export type WorkflowRule = {
  id: string;
  name: string;
  condition: string;
  action: string;
  active: boolean;
};

export type NotificationRule = {
  id: string;
  event: string;
  recipient: string;
  channel: string;
  active: boolean;
};
