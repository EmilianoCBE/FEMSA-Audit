import type { FieldRequirement, FormFieldType } from "../types";

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  "short-text": "Texto corto",
  "long-text": "Texto largo",
  catalog: "Catálogo",
  calculated: "Calculado",
  date: "Fecha",
};

export const FIELD_REQUIREMENT_LABELS: Record<FieldRequirement, string> = {
  required: "Obligatorio",
  optional: "Opcional",
  automatic: "Automático",
};
