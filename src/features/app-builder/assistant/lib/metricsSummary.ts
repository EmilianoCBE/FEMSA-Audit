import type { DecisionCounts, DesignerMetrics, SuggestionSource } from "../types";

export type SourceSummary = {
  source: SuggestionSource;
  label: string;
  decided: number;
  /** "75 %" o "—" si todavía no hay decisiones. */
  acceptance: string;
  detail: string;
};

const LABEL: Record<SuggestionSource, string> = { rules: "Reglas", ai: "IA" };

const decidedOf = (counts: DecisionCounts) => counts.accepted + counts.replaced + counts.rejected;

/** Texto de las métricas del asistente por origen (reglas / IA). */
export function summarizeMetrics(metrics: DesignerMetrics): SourceSummary[] {
  return (["rules", "ai"] as const).map((source) => {
    const counts = metrics.bySource[source];
    const rate = metrics.acceptanceRate[source];
    return {
      source,
      label: LABEL[source],
      decided: decidedOf(counts),
      acceptance: rate === null ? "—" : `${Math.round(rate * 100)} %`,
      detail: `${counts.accepted} aceptadas · ${counts.replaced} reemplazadas · ${counts.rejected} rechazadas · ${counts.pending} pendientes`,
    };
  });
}

/** Latencia promedio de la IA en segundos, con la meta del plan de calidad (< 10 s). */
export function formatLatency(ms: number | null): string | null {
  if (ms === null) return null;
  return `${(ms / 1000).toFixed(1)} s${ms < 10_000 ? " (meta < 10 s)" : " (arriba de la meta de 10 s)"}`;
}
