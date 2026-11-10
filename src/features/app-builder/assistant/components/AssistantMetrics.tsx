import { useCallback } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { formatLatency, summarizeMetrics } from "../lib/metricsSummary";
import { assistantService } from "../services/assistantService";

// US17 - Emiliano Carrizales: qué tanto se aceptan las propuestas del asistente (registradas en AppAiRecommendations).

type AssistantMetricsProps = {
  appId: string;
  /** Cambia cuando hay un análisis o una decisión nueva, para volver a pedir las métricas. */
  refreshKey: number;
};

export function AssistantMetrics({ appId, refreshKey }: AssistantMetricsProps) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey solo sirve para volver a pedir los datos.
  const fetcher = useCallback((signal: AbortSignal) => assistantService.metrics(appId, signal), [appId, refreshKey]);
  const { data, error } = useQuery(fetcher);

  if (error) {
    return (
      <p className="mt-4 border-t border-line pt-3 text-label text-muted">
        Las métricas del asistente no están disponibles.
      </p>
    );
  }
  if (!data) return null;

  const latency = formatLatency(data.avgAiLatencyMs);

  return (
    <section aria-label="Métricas del asistente" className="mt-4 border-t border-line pt-3">
      <div className="text-label font-semibold uppercase text-muted">Decisiones registradas</div>
      <dl className="mt-2 grid grid-cols-2 gap-2">
        {summarizeMetrics(data).map((summary) => (
          <div key={summary.source} className="rounded-md border border-line bg-surface p-2">
            <dt className="text-label text-muted">{summary.label}: aceptación</dt>
            <dd className="text-body font-semibold text-ink">{summary.acceptance}</dd>
            <dd className="mt-0.5 text-label text-muted">{summary.detail}</dd>
          </div>
        ))}
      </dl>
      {latency && <p className="mt-2 text-label text-muted">Tiempo promedio de la IA: {latency}</p>}
    </section>
  );
}
