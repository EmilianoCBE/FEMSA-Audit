import type { TransitionRequirements, WorkflowDiagram } from "../types";
import { TONE_BY_KIND } from "./workflowEditing";
import { autoLayout } from "./workflowLayout";

// Fase 3 del workflow - Emiliano Carrizales: un flujo "en esqueleto" (estados y transiciones, sin posiciones) se
// convierte en diagrama acomodado. Lo usan las plantillas (sin IA) y lo que propone la IA desde una descripción (RF-17).

export type WorkflowOutline = {
  states: readonly { id: string; name: string; kind: string; slaDays?: number }[];
  transitions: readonly {
    id?: string;
    from: string;
    to: string;
    label: string;
    role: string | null;
    requires?: TransitionRequirements;
  }[];
};

export function diagramFromOutline(outline: WorkflowOutline): WorkflowDiagram {
  const kindOf = new Map(outline.states.map((state) => [state.id, state.kind]));
  const used = new Set<string>();
  const diagram: WorkflowDiagram = {
    size: { width: 640, height: 260 },
    states: outline.states.map((state) => ({
      id: state.id,
      name: state.name,
      kind: state.kind,
      tone: TONE_BY_KIND[state.kind] ?? "neutral",
      position: { x: 0, y: 0 },
      ...(state.slaDays && { slaDays: state.slaDays }),
    })),
    transitions: outline.transitions.map((transition, index) => {
      let id = transition.id ?? `t${index + 1}-${transition.from}-${transition.to}`.slice(0, 60);
      for (let n = 2; used.has(id); n++) id = `${id}-${n}`;
      used.add(id);
      return {
        id,
        label: transition.label,
        from: transition.from,
        to: transition.to,
        role: transition.role,
        path: "",
        labelPosition: { x: 0, y: 0 },
        variant: kindOf.get(transition.to) === "Retorno" ? ("rejected" as const) : ("default" as const),
        ...(transition.requires && { requires: transition.requires }),
      };
    }),
    warnings: [],
    suggestedStates: [],
    annotations: [],
  };
  return autoLayout(diagram);
}

export type WorkflowTemplate = { id: string; name: string; description: string; outline: WorkflowOutline };

const comment = { comment: true } as const;
const evidence = { evidence: true } as const;

/** Plantillas de auditoría interna listas para usar (no dependen de la IA: sirven también cuando no está, US18). */
export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    id: "hallazgo-completo",
    name: "Hallazgo con plan de acción",
    description:
      "Documentar → revisión del jefe → respuesta del área → aprobación de dirección → remediación → validación → cierre, " +
      "con aceptación formal del riesgo como salida alterna.",
    outline: {
      states: [
        { id: "borrador", name: "Borrador", kind: "Inicial" },
        { id: "revision-jefe", name: "Revisión del jefe", kind: "Aprobación", slaDays: 5 },
        { id: "respuesta-area", name: "Respuesta del área", kind: "En proceso", slaDays: 10 },
        { id: "aprobacion-direccion", name: "Aprobación de dirección", kind: "Aprobación", slaDays: 5 },
        { id: "remediacion", name: "En remediación", kind: "En proceso", slaDays: 90 },
        { id: "validacion", name: "Validación de la remediación", kind: "Aprobación", slaDays: 10 },
        { id: "cerrado", name: "Cerrado", kind: "Final" },
        { id: "devuelto", name: "Devuelto al auditor", kind: "Retorno" },
        { id: "riesgo-aceptado", name: "Riesgo aceptado", kind: "Final" },
      ],
      transitions: [
        { from: "borrador", to: "revision-jefe", label: "enviar a revisión", role: "Auditor", requires: evidence },
        { from: "revision-jefe", to: "respuesta-area", label: "comunicar al área", role: "Jefe de Auditoría" },
        { from: "revision-jefe", to: "devuelto", label: "devolver", role: "Jefe de Auditoría", requires: comment },
        { from: "devuelto", to: "revision-jefe", label: "corregir y reenviar", role: "Auditor" },
        {
          from: "respuesta-area",
          to: "aprobacion-direccion",
          label: "responder con plan",
          role: "Responsable del área",
          requires: { actionPlan: true },
        },
        {
          from: "aprobacion-direccion",
          to: "devuelto",
          label: "rechazar",
          role: "Dirección de Auditoría",
          requires: comment,
        },
        { from: "aprobacion-direccion", to: "remediacion", label: "aprobar", role: "Dirección de Auditoría" },
        {
          from: "aprobacion-direccion",
          to: "riesgo-aceptado",
          label: "aceptar el riesgo",
          role: "Dirección de Auditoría",
          requires: { comment: true, evidence: true },
        },
        {
          from: "remediacion",
          to: "validacion",
          label: "entregar evidencia",
          role: "Responsable del área",
          requires: evidence,
        },
        {
          from: "validacion",
          to: "remediacion",
          label: "evidencia insuficiente",
          role: "Jefe de Auditoría",
          requires: comment,
        },
        { from: "validacion", to: "cerrado", label: "cerrar", role: "Jefe de Auditoría", requires: evidence },
      ],
    },
  },
  {
    id: "hallazgo-simple",
    name: "Hallazgo sin seguimiento",
    description: "Documentar → revisión del jefe → aprobación de dirección → cierre. Para observaciones menores.",
    outline: {
      states: [
        { id: "borrador", name: "Borrador", kind: "Inicial" },
        { id: "revision-jefe", name: "Revisión del jefe", kind: "Aprobación", slaDays: 5 },
        { id: "aprobacion-direccion", name: "Aprobación de dirección", kind: "Aprobación", slaDays: 5 },
        { id: "cerrado", name: "Cerrado", kind: "Final" },
        { id: "devuelto", name: "Devuelto al auditor", kind: "Retorno" },
      ],
      transitions: [
        { from: "borrador", to: "revision-jefe", label: "enviar a revisión", role: "Auditor", requires: evidence },
        { from: "revision-jefe", to: "aprobacion-direccion", label: "aprobar", role: "Jefe de Auditoría" },
        { from: "revision-jefe", to: "devuelto", label: "devolver", role: "Jefe de Auditoría", requires: comment },
        {
          from: "aprobacion-direccion",
          to: "devuelto",
          label: "rechazar",
          role: "Dirección de Auditoría",
          requires: comment,
        },
        { from: "devuelto", to: "revision-jefe", label: "corregir y reenviar", role: "Auditor" },
        {
          from: "aprobacion-direccion",
          to: "cerrado",
          label: "aprobar y cerrar",
          role: "Dirección de Auditoría",
          requires: evidence,
        },
      ],
    },
  },
];
