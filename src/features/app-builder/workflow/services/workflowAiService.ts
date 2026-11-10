import { httpClient } from "@/shared/api/httpClient";
import type { DesignerMetrics } from "@/features/app-builder/assistant/types";
import type { WorkflowDecision } from "../components/inspector/DesignAssistantPanel";
import type { WorkflowAiAnalysis, WorkflowAiRequest, WorkflowGeneration } from "../lib/workflowAi";
import type { WorkflowChange, WorkflowSuggestion } from "../lib/workflowAssistant";

// US15 (RF-17, RF-18) y fase 3 del workflow: el backend pregunta a la IA y devuelve propuestas validadas; con el
// formulario registra las sugerencias y cada decisión (dbo.AppAiRecommendations, scope 'workflow').
export const workflowAiService = {
  analyze: (request: WorkflowAiRequest, signal?: AbortSignal) =>
    httpClient.post<WorkflowAiAnalysis>("/ai/workflow/analyze", request, signal),

  /** RF-17: flujo completo propuesto a partir de una descripción (no se guarda ni se aplica). */
  generate: (description: string, signal?: AbortSignal) =>
    httpClient.post<WorkflowGeneration>("/ai/workflow/generate", { description }, signal),

  /** Decisión sobre una sugerencia de la IA que el back ya guardó (tiene id de BD). */
  decideAi: (suggestionId: string, decision: WorkflowDecision, change?: WorkflowChange) =>
    httpClient.post<unknown>(`/ai/recommendations/${encodeURIComponent(suggestionId)}/decision`, {
      decision,
      ...(decision === "replaced" && { change }),
    }),

  /** Decisión sobre una revisión de las reglas (corren en el navegador; se guarda ya decidida). */
  decideRule: (appId: string, suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) =>
    httpClient.post<unknown>("/ai/workflow/decisions", {
      appId,
      suggestion: {
        rule: suggestion.rule,
        title: suggestion.title,
        reason: suggestion.reason,
        target: suggestion.target,
        ...(suggestion.change && { change: suggestion.change }),
      },
      decision,
      ...(decision === "replaced" && { change }),
    }),

  metrics: (appId: string, signal?: AbortSignal) =>
    httpClient.get<DesignerMetrics>(`/ai/workflow/metrics?appId=${encodeURIComponent(appId)}`, signal),
};
