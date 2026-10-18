import { describe, expect, it } from "vitest";
import { describeConfig, parseChanges } from "./versionChanges";

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

describe("describeConfig", () => {
  const base = { x: 0, y: 0, width: 100, height: 40 };

  it("usa la etiqueta del campo o su tipo si no tiene", () => {
    expect(
      describeConfig({
        elements: [
          { ...base, id: "a", type: "short-text", config: { label: "Título" } },
          { ...base, id: "b", type: "date", config: {} },
        ],
      }),
    ).toEqual(["Título", "Campo date"]);
  });

  it("tolera configuraciones sin elementos", () => {
    expect(describeConfig({})).toEqual([]);
  });
});
