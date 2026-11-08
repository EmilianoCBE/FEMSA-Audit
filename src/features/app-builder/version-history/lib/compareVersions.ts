import type { ElementoDesigner } from "../../designer/types";
import type { AppConfig } from "../types";
import { fieldLabel, typeLabel } from "./versionChanges";

export type FieldChange = { id: string; label: string; details: string[] };

export type ConfigDiff = {
  added: { id: string; label: string }[];
  removed: { id: string; label: string }[];
  changed: FieldChange[];
};

const CONFIG_LABELS: Record<string, string> = {
  label: "Etiqueta",
  required: "Obligatorio",
  section: "Sección",
  description: "Descripción",
  formula: "Fórmula",
  editable: "Editable",
  includeInReports: "En reportes",
  visibleStates: "Estados visibles",
};

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function fieldDetails(before: ElementoDesigner, after: ElementoDesigner): string[] {
  const details: string[] = [];
  if (before.type !== after.type) details.push(`Tipo: ${typeLabel(before.type)} → ${typeLabel(after.type)}`);

  const keys = new Set([...Object.keys(before.config ?? {}), ...Object.keys(after.config ?? {})]);
  for (const key of keys) {
    const a = before.config?.[key];
    const b = after.config?.[key];
    if (!same(a, b)) details.push(`${CONFIG_LABELS[key] ?? key}: ${formatValue(a)} → ${formatValue(b)}`);
  }

  if (before.x !== after.x || before.y !== after.y) details.push("Cambió de posición");
  if (before.width !== after.width || before.height !== after.height) details.push("Cambió de tamaño");
  return details;
}

/** Qué campos se agregaron, quitaron o modificaron de `before` a `after` (se comparan por id). */
export function diffConfigs(before: AppConfig, after: AppConfig): ConfigDiff {
  const beforeElements = before.elements ?? [];
  const afterElements = after.elements ?? [];
  const beforeById = new Map(beforeElements.map((element) => [element.id, element]));
  const afterIds = new Set(afterElements.map((element) => element.id));

  const diff: ConfigDiff = { added: [], removed: [], changed: [] };
  for (const element of afterElements) {
    const previous = beforeById.get(element.id);
    if (!previous) {
      diff.added.push({ id: element.id, label: fieldLabel(element) });
      continue;
    }
    const details = fieldDetails(previous, element);
    if (details.length) diff.changed.push({ id: element.id, label: fieldLabel(element), details });
  }
  for (const element of beforeElements) {
    if (!afterIds.has(element.id)) diff.removed.push({ id: element.id, label: fieldLabel(element) });
  }
  return diff;
}

export const isEmptyDiff = (diff: ConfigDiff) => !diff.added.length && !diff.removed.length && !diff.changed.length;

/** Texto sugerido para "Cambios de esta versión" (uno por línea), a partir de la diferencia. */
export function suggestChanges(diff: ConfigDiff): string[] {
  return [
    ...diff.added.map((field) => `Se agregó el campo ${field.label}`),
    ...diff.removed.map((field) => `Se quitó el campo ${field.label}`),
    ...diff.changed.map((field) => {
      const what = field.details.map((detail) => detail.split(":")[0]).join(", ");
      return `Se modificó el campo ${field.label} (${what.toLowerCase()})`;
    }),
  ];
}
