import { describe, expect, it } from "vitest";
import type { ElementoDesigner } from "../../designer/types";
import { applyDesignerChange, describeChange, targetFieldId } from "./designerChanges";

const field = (id: string, type: ElementoDesigner["type"], label: string): ElementoDesigner => ({
  id,
  type,
  x: 0,
  y: 0,
  width: 520,
  height: 56,
  config: { label, section: "evaluacion", required: false },
});

const form = [field("f1", "short-text", "Fecha compromiso"), field("c1", "calculated", "Riesgo residual")];

describe("US17 aplicar una sugerencia aceptada", () => {
  it("cambia el tipo, renombra, marca obligatorio y pone fórmula sin tocar los demás campos", () => {
    expect(applyDesignerChange(form, { op: "change-field-type", fieldId: "f1", type: "date" })[0].type).toBe("date");
    expect(
      applyDesignerChange(form, { op: "rename-field", fieldId: "f1", label: "Fecha límite" })[0].config.label,
    ).toBe("Fecha límite");
    expect(applyDesignerChange(form, { op: "set-required", fieldId: "f1", required: true })[0].config.required).toBe(
      true,
    );
    const withFormula = applyDesignerChange(form, { op: "set-formula", fieldId: "c1", formula: "a * b" });
    expect(withFormula[1].config.formula).toBe("a * b");
    expect(withFormula[0]).toBe(form[0]);
  });

  it("agrega un campo nuevo al final con su sección", () => {
    const result = applyDesignerChange(
      form,
      { op: "add-field", type: "date", label: "Fecha de detección", section: "identificacion" },
      () => "nuevo",
    );
    expect(result).toHaveLength(3);
    expect(result[2]).toMatchObject({
      id: "nuevo",
      type: "date",
      config: { label: "Fecha de detección", section: "identificacion" },
    });
    expect(targetFieldId({ op: "add-field", type: "date", label: "x" }, result)).toBe("nuevo");
  });

  it("no modifica el formulario original (rechazar o no aceptar no cambia nada)", () => {
    const copy = structuredClone(form);
    applyDesignerChange(form, { op: "change-field-type", fieldId: "f1", type: "date" });
    expect(form).toEqual(copy);
  });

  it("falla si el campo ya no existe", () => {
    expect(() => applyDesignerChange(form, { op: "rename-field", fieldId: "borrado", label: "x" })).toThrow(
      /ya no existe/,
    );
  });

  it("describe el cambio con las etiquetas del formulario", () => {
    expect(describeChange({ op: "change-field-type", fieldId: "f1", type: "date" }, form)).toBe(
      "Cambiar «Fecha compromiso» a Fecha",
    );
    expect(describeChange({ op: "add-field", type: "number", label: "Monto" }, form)).toBe(
      "Agregar «Monto» (Numérico)",
    );
  });
});
