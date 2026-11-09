import type { ElementoDesigner } from "../../designer/types";
import type { DesignerChange, DesignerFieldType } from "../types";

// US17: la IA solo propone; este código es el único que modifica el formulario y solo cuando el usuario acepta.

export const FIELD_TYPE_NAMES: Record<DesignerFieldType, string> = {
  "short-text": "Texto corto",
  "long-text": "Texto largo",
  catalog: "Lista de opciones",
  calculated: "Campo calculado",
  date: "Fecha",
  number: "Numérico",
  section: "Adjunto",
};

const label = (elements: readonly ElementoDesigner[], fieldId: string) =>
  elements.find((element) => element.id === fieldId)?.config.label?.trim() || fieldId;

/** Texto corto del cambio para mostrarlo antes de aceptarlo. */
export function describeChange(change: DesignerChange, elements: readonly ElementoDesigner[]): string {
  switch (change.op) {
    case "change-field-type":
      return `Cambiar «${label(elements, change.fieldId)}» a ${FIELD_TYPE_NAMES[change.type]}`;
    case "rename-field":
      return `Renombrar «${label(elements, change.fieldId)}» a «${change.label}»`;
    case "set-required":
      return `${change.required ? "Hacer obligatorio" : "Hacer opcional"} «${label(elements, change.fieldId)}»`;
    case "set-formula":
      return `Usar la fórmula ${change.formula} en «${label(elements, change.fieldId)}»`;
    case "add-field":
      return `Agregar «${change.label}» (${FIELD_TYPE_NAMES[change.type]})`;
  }
}

/** Id del campo que queda afectado (el nuevo, si se agrega uno). */
export function targetFieldId(change: DesignerChange, result: readonly ElementoDesigner[]): string | undefined {
  return change.op === "add-field" ? result.at(-1)?.id : change.fieldId;
}

/**
 * Devuelve un formulario nuevo con el cambio aplicado; no modifica el original.
 * Falla si el campo ya no existe (por ejemplo, se borró después de analizar).
 */
export function applyDesignerChange(
  elements: readonly ElementoDesigner[],
  change: DesignerChange,
  createId: () => string = () => `campo_designer_ia_${Date.now()}`,
): ElementoDesigner[] {
  if (change.op === "add-field") {
    const added: ElementoDesigner = {
      id: createId(),
      type: change.type,
      x: 0,
      y: elements.length,
      width: 520,
      height: change.type === "long-text" ? 72 : 56,
      config: {
        label: change.label,
        section: change.section ?? "evaluacion",
        required: false,
        editable: false,
        includeInReports: false,
        visibleStates: ["revision", "validacion_jefatura"],
      },
    };
    return [...elements, added];
  }

  if (!elements.some((element) => element.id === change.fieldId)) {
    throw new Error("El campo de la sugerencia ya no existe. Vuelve a analizar el formulario.");
  }

  return elements.map((element) => {
    if (element.id !== change.fieldId) return element;
    switch (change.op) {
      case "change-field-type":
        return { ...element, type: change.type };
      case "rename-field":
        return { ...element, config: { ...element.config, label: change.label } };
      case "set-required":
        return { ...element, config: { ...element.config, required: change.required } };
      case "set-formula":
        return { ...element, config: { ...element.config, formula: change.formula } };
      default:
        return element;
    }
  });
}
