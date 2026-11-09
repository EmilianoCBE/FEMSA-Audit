import { httpClient } from "@/shared/api/httpClient";
import type { DesignerAnalysis, DesignerChange, DesignerMetrics, SuggestionDecision } from "../types";

// US15-US17 - Emiliano Carrizales: el backend analiza el formulario guardado y solo devuelve propuestas.
export const assistantService = {
  analyzeDesigner: (appId: string) => httpClient.post<DesignerAnalysis>("/ai/designer/analyze", { appId }),

  /** US17: registra la decisión del usuario; `change` solo cuando la reemplazó. */
  decide: (suggestionId: string, decision: SuggestionDecision, change?: DesignerChange) =>
    httpClient.post<unknown>(`/ai/recommendations/${encodeURIComponent(suggestionId)}/decision`, {
      decision,
      ...(decision === "replaced" && { change }),
    }),

  /** US17: cuántas sugerencias se aceptaron, reemplazaron o rechazaron, por origen. */
  metrics: (appId: string, signal?: AbortSignal) =>
    httpClient.get<DesignerMetrics>(`/ai/designer/metrics?appId=${encodeURIComponent(appId)}`, signal),
};
