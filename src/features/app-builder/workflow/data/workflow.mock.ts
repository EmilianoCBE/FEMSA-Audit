import type {
  AssistantSuggestion,
  AssistantSummary,
  NotificationRule,
  TransitionSettings,
  WorkflowDiagram,
  WorkflowRule,
} from "../types";

export const findingLifecycleMock: WorkflowDiagram = {
  size: { width: 1010, height: 340 },
  selectedStateId: "director-validation",
  states: [
    { id: "draft", kind: "Inicial", name: "Borrador", tone: "neutral", position: { x: 22, y: 20 } },
    { id: "in-review", kind: "En proceso", name: "En revisión", tone: "amber", position: { x: 222, y: 20 } },
    { id: "manager-validation", kind: "Aprobación", name: "Validación del responsable", tone: "accent", position: { x: 422, y: 20 } },
    { id: "director-validation", kind: "Aprobación", name: "Validación dirección", tone: "accent", position: { x: 622, y: 20 } },
    { id: "closed", kind: "Final", name: "Cerrado", tone: "green", position: { x: 822, y: 20 } },
    { id: "rejected", kind: "Retorno", name: "Rechazado", tone: "red", position: { x: 622, y: 170 } },
  ],
  transitions: [
    { id: "send", label: "enviar", path: "M174 50 L214 50", labelPosition: { x: 194, y: 42 }, labelAnchor: "middle", variant: "default" },
    { id: "review", label: "revisar", path: "M374 50 L414 50", labelPosition: { x: 394, y: 42 }, labelAnchor: "middle", variant: "default" },
    { id: "approve", label: "aprobar", path: "M574 50 L614 50", labelPosition: { x: 594, y: 42 }, labelAnchor: "middle", variant: "active" },
    { id: "close", label: "cerrar", path: "M774 50 L814 50", labelPosition: { x: 794, y: 42 }, labelAnchor: "middle", variant: "default" },
    { id: "reject", label: "rechazar", path: "M690 82 L690 168", labelPosition: { x: 698, y: 128 }, variant: "rejected" },
    {
      id: "return-to-review",
      label: "devolver a revisión",
      path: "M614 198 L450 198 L450 82",
      labelPosition: { x: 532, y: 192 },
      labelAnchor: "middle",
      variant: "rejected",
    },
    { id: "suggested-risk", label: "sugerida", path: "M498 82 L498 168", labelPosition: { x: 506, y: 128 }, variant: "suggested" },
  ],
  warnings: [
    { id: "no-exit", message: "Sin salida configurada", position: { x: 766, y: 164 } },
    { id: "no-role", message: "Transición sin rol asignado", position: { x: 766, y: 14 } },
  ],
  suggestedStates: [{ id: "risk-acceptance", kind: "Sugerido", name: "Aceptación de riesgo", position: { x: 422, y: 170 } }],
  annotations: [{ id: "suggested-severity", label: "Severidad sugerida", position: { x: 422, y: 88 } }],
};

export const selectedTransitionMock: TransitionSettings = {
  title: "Validación del responsable → Validación dirección",
  permissions: [
    { label: "Rol que puede ejecutarla", value: "Jefe de Auditoría" },
    { label: "Segregación de funciones", value: "No puede aprobar su propia auditoría" },
  ],
  preconditions: [
    { id: "evidence", label: "Tiene al menos una evidencia adjunta", enabled: true },
    { id: "residual-risk", label: "Riesgo residual calculado", enabled: true },
    { id: "action-plan", label: "severidad >= Alto requiere plan de acción", enabled: true },
    { id: "reviewer-comment", label: "Comentario del revisor obligatorio", enabled: false },
  ],
  automations: [
    {
      id: "suggest-severity",
      label: "Sugerir severidad",
      description: "Propone un nivel a partir del control, la evidencia y hallazgos históricos similares.",
      enabled: true,
    },
    {
      id: "suggest-approver",
      label: "Sugerir aprobador",
      description: "Recomienda al responsable según matriz de roles y área auditada.",
      enabled: true,
    },
  ],
};

export const assistantSummaryMock: AssistantSummary = { inconsistencies: 3, suggestedRelations: 2 };

export const assistantSuggestionsMock: readonly AssistantSuggestion[] = [
  {
    id: "missing-role",
    type: "warning",
    title: "Transición sin rol asignado",
    description: "La transición aprobar no tiene un rol alterno para ausencia del jefe de auditoría.",
    confidence: "Alta",
  },
  {
    id: "risk-acceptance",
    type: "idea",
    title: "Agregar aceptación de riesgo",
    description: "Detecté casos históricos donde dirección acepta riesgo sin plan de acción.",
    confidence: "Alta",
  },
];

export const workflowRulesMock: WorkflowRule[] = [
  { id: "evidence", name: "Evidencia requerida", condition: "Antes de validar responsable", action: "Bloquear avance", active: true },
  { id: "action-plan", name: "Plan obligatorio", condition: "Severidad alta", action: "Solicitar plan de acción", active: true },
  { id: "reject-comment", name: "Comentario de rechazo", condition: "Al rechazar", action: "Pedir comentario", active: true },
];

export const notificationRulesMock: NotificationRule[] = [
  { id: "sent", event: "Hallazgo enviado", recipient: "Jefe de Auditoría", channel: "Email", active: true },
  { id: "plan-overdue", event: "Plan vencido", recipient: "Responsable del plan", channel: "Email + bandeja", active: true },
  { id: "closed", event: "Hallazgo cerrado", recipient: "Área auditada", channel: "Bandeja", active: true },
];
