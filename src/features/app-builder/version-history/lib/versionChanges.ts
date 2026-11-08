import type { ElementoDesigner } from "../../designer/types";
import type { AppConfig } from "../types";

/** Mismos límites que valida la API al guardar una versión. */
export const MAX_CHANGES = 20;
export const MAX_CHANGE_LENGTH = 300;

const TYPE_LABELS: Record<ElementoDesigner["type"], string> = {
  "short-text": "Texto corto",
  "long-text": "Texto largo",
  catalog: "Lista de opciones",
  calculated: "Campo calculado",
  date: "Fecha",
  number: "Numérico",
  section: "Adjunto",
};

export const typeLabel = (type: string) => TYPE_LABELS[type as ElementoDesigner["type"]] ?? type;

/** Texto del formulario -> lista de cambios: una línea por cambio, sin líneas vacías ni viñetas. */
export function parseChanges(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

/** Problema que la API rechazaría (400), para avisarlo antes de enviar; `undefined` si todo está bien. */
export function validateChangesText(changes: string[]): string | undefined {
  if (changes.length > MAX_CHANGES) return `Máximo ${MAX_CHANGES} cambios por versión (hay ${changes.length}).`;
  const index = changes.findIndex((change) => change.length > MAX_CHANGE_LENGTH);
  if (index >= 0) {
    return `El cambio ${index + 1} tiene ${changes[index].length} caracteres (máximo ${MAX_CHANGE_LENGTH}).`;
  }
  return undefined;
}

export const fieldLabel = (element: ElementoDesigner) =>
  element.config?.label?.trim() || `Campo ${typeLabel(element.type)}`;

export type FieldSummary = { id: string; label: string; type: string; required: boolean };

/** Campos guardados en una versión, para mostrarlos al consultarla. */
export function describeFields(config: AppConfig): FieldSummary[] {
  return (config.elements ?? []).map((element) => ({
    id: element.id,
    label: fieldLabel(element),
    type: typeLabel(element.type),
    required: element.config?.required === true,
  }));
}
