import { describe, expect, it } from "vitest";
import { formatMonth, getLevelDescription, getLevelStyle, getRiskLevel, RISK_LEVELS } from "./riskLevels";

describe("US07 niveles de riesgo", () => {
  it("US07.3 asigna el nivel con los mismos umbrales que el backend", () => {
    expect([1, 4].map(getRiskLevel)).toEqual(["Bajo", "Bajo"]);
    expect([5, 9].map(getRiskLevel)).toEqual(["Medio", "Medio"]);
    expect([10, 16].map(getRiskLevel)).toEqual(["Alto", "Alto"]);
    expect([17, 25].map(getRiskLevel)).toEqual(["Crítico", "Crítico"]);
  });

  it("cubre toda la matriz 5x5 sin huecos", () => {
    for (let probability = 1; probability <= 5; probability++) {
      for (let impact = 1; impact <= 5; impact++) {
        expect(RISK_LEVELS).toContain(getRiskLevel(probability * impact));
      }
    }
  });

  it("US07.4 cada nivel tiene descripción y color propios", () => {
    const styles = RISK_LEVELS.map(getLevelStyle);
    expect(new Set(styles).size).toBe(RISK_LEVELS.length);
    for (const level of RISK_LEVELS) expect(getLevelDescription(level)).not.toBe("");
    expect(getLevelDescription("Otro")).toBe("");
    expect(getLevelStyle("Otro")).toContain("bg-nav");
  });

  it("formatea meses y deja intacto un valor inválido", () => {
    expect(formatMonth("2026-10")).toMatch(/oct/i);
    expect(formatMonth("sin fecha")).toBe("sin fecha");
  });
});
