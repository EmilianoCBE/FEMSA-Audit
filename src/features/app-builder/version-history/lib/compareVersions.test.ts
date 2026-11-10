import { describe, expect, it } from "vitest";
import type { ElementoDesigner } from "../../designer/types";
import { diffConfigs, isEmptyDiff, suggestChanges } from "./compareVersions";

const field = (id: string, config: ElementoDesigner["config"], extra: Partial<ElementoDesigner> = {}) =>
  ({ id, type: "short-text", x: 0, y: 0, width: 200, height: 48, config, ...extra }) as ElementoDesigner;

describe("diffConfigs", () => {
  it("detecta campos agregados, quitados y modificados (por id)", () => {
    const before = { elements: [field("titulo", { label: "Título" }), field("notas", { label: "Notas" })] };
    const after = {
      elements: [
        field("titulo", { label: "Título del hallazgo", required: true }, { type: "long-text", y: 40 }),
        field("monto", { label: "Monto" }, { type: "number" }),
      ],
    };

    expect(diffConfigs(before, after)).toEqual({
      added: [{ id: "monto", label: "Monto" }],
      removed: [{ id: "notas", label: "Notas" }],
      changed: [
        {
          id: "titulo",
          label: "Título del hallazgo",
          details: [
            "Tipo: Texto corto → Texto largo",
            "Etiqueta: Título → Título del hallazgo",
            "Obligatorio: — → Sí",
            "Cambió de posición",
          ],
        },
      ],
    });
  });

  it("no reporta diferencias entre configuraciones iguales o vacías", () => {
    const config = { elements: [field("titulo", { label: "Título", visibleStates: ["revision"] })] };
    expect(isEmptyDiff(diffConfigs(config, structuredClone(config)))).toBe(true);
    expect(isEmptyDiff(diffConfigs({}, {}))).toBe(true);
  });
});

describe("suggestChanges", () => {
  it("convierte la diferencia en una línea por cambio", () => {
    const diff = diffConfigs(
      { elements: [field("titulo", { label: "Título" }), field("notas", { label: "Notas" })] },
      { elements: [field("titulo", { label: "Título", required: true }), field("monto", { label: "Monto" })] },
    );
    expect(suggestChanges(diff)).toEqual([
      "Se agregó el campo Monto",
      "Se quitó el campo Notas",
      "Se modificó el campo Título (obligatorio)",
    ]);
  });
});
