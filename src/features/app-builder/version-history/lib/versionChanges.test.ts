import { describe, expect, it } from "vitest";
import { describeFields, parseChanges, validateChangesText } from "./versionChanges";

describe("parseChanges", () => {
  it("separa un cambio por línea y quita viñetas y líneas vacías", () => {
    expect(parseChanges("- Se agregó Riesgo residual\n\n  * Se ocultó Notas  \n• Otro")).toEqual([
      "Se agregó Riesgo residual",
      "Se ocultó Notas",
      "Otro",
    ]);
  });

  it("devuelve una lista vacía si no hay texto", () => {
    expect(parseChanges("  \n ")).toEqual([]);
  });
});

describe("validateChangesText", () => {
  it("acepta hasta 20 cambios de hasta 300 caracteres", () => {
    expect(validateChangesText(Array.from({ length: 20 }, () => "x".repeat(300)))).toBeUndefined();
  });

  it("avisa cuántos cambios sobran o qué cambio es demasiado largo", () => {
    expect(validateChangesText(Array.from({ length: 21 }, () => "c"))).toMatch(/Máximo 20 .*hay 21/);
    expect(validateChangesText(["ok", "x".repeat(301)])).toBe("El cambio 2 tiene 301 caracteres (máximo 300).");
  });
});

describe("describeFields", () => {
  const base = { x: 0, y: 0, width: 100, height: 40 };

  it("usa la etiqueta del campo o su tipo si no tiene, e indica si es obligatorio", () => {
    expect(
      describeFields({
        elements: [
          { ...base, id: "a", type: "short-text", config: { label: "Título", required: true } },
          { ...base, id: "b", type: "date", config: {} },
        ],
      }),
    ).toEqual([
      { id: "a", label: "Título", type: "Texto corto", required: true },
      { id: "b", label: "Campo Fecha", type: "Fecha", required: false },
    ]);
  });

  it("tolera configuraciones sin elementos", () => {
    expect(describeFields({})).toEqual([]);
  });
});
