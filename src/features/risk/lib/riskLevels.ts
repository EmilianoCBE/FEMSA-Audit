/**
 * Niveles de riesgo (US07). Los umbrales deben coincidir con `models/risk.model.js` del backend,
 * que es quien clasifica; aquí solo se usan para pintar la matriz y las etiquetas.
 */
export const RISK_LEVELS = ["Bajo", "Medio", "Alto", "Crítico"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 4) return "Bajo";
  if (score <= 9) return "Medio";
  if (score <= 16) return "Alto";
  return "Crítico";
}

export function getLevelDescription(level: string): string {
  switch (level) {
    case "Bajo":
      return "El riesgo se encuentra dentro de un nivel bajo.";
    case "Medio":
      return "El riesgo requiere seguimiento y evaluación.";
    case "Alto":
      return "El riesgo requiere atención y acciones de control.";
    case "Crítico":
      return "El riesgo requiere atención prioritaria.";
    default:
      return "";
  }
}

export function getLevelStyle(level: string): string {
  switch (level) {
    case "Bajo":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Medio":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Alto":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "Crítico":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-line bg-nav text-ink";
  }
}

/** Convierte "2026-10" en "oct 26"; si el valor no es un mes válido lo regresa igual. */
export function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "2-digit",
  });
}
