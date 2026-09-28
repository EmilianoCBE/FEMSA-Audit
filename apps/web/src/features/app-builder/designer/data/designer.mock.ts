import type { FormField, PermissionMatrixData, ValidationRule } from "../types";

export const formFieldsMock: FormField[] = [
  { id: "title", name: "Título del hallazgo", type: "short-text", requirement: "required" },
  { id: "description", name: "Descripción", type: "long-text", requirement: "required" },
  { id: "control", name: "Control asociado", type: "catalog", requirement: "required" },
  { id: "residual-risk", name: "Riesgo residual", type: "calculated", requirement: "automatic" },
  { id: "due-date", name: "Fecha compromiso", type: "date", requirement: "required" },
];

export const permissionMatrixMock: PermissionMatrixData = {
  roles: [
    { id: "auditor", label: "Auditor" },
    { id: "manager", label: "Jefatura" },
    { id: "director", label: "Dirección" },
    { id: "auditee", label: "Área auditada" },
  ],
  permissions: [
    { fieldId: "title", fieldName: "Título del hallazgo", levels: { auditor: "edit", manager: "edit", director: "read", auditee: "read" } },
    { fieldId: "control", fieldName: "Control asociado", levels: { auditor: "edit", manager: "edit", director: "read", auditee: "read" } },
    { fieldId: "residual-risk", fieldName: "Riesgo residual", levels: { auditor: "edit", manager: "edit", director: "read", auditee: "read" } },
    { fieldId: "internal-notes", fieldName: "Notas internas", levels: { auditor: "edit", manager: "read", director: "read", auditee: "hidden" } },
  ],
};

export const validationRulesMock: ValidationRule[] = [
  { id: "title-length", fieldName: "Título del hallazgo", condition: "longitud <= 120", message: "El título no puede exceder 120 caracteres.", active: true },
  {
    id: "control-exists",
    fieldName: "Control asociado",
    condition: "existe en catálogo de controles",
    message: "Selecciona un control vigente del catálogo.",
    active: true,
  },
  { id: "due-date-future", fieldName: "Fecha compromiso", condition: "fecha >= hoy", message: "La fecha compromiso no puede ser anterior a hoy.", active: true },
  {
    id: "risk-justification",
    fieldName: "Riesgo residual",
    condition: "si editado manualmente -> justificación no vacía",
    message: "Explica por qué modificaste el riesgo calculado.",
    active: true,
  },
];
