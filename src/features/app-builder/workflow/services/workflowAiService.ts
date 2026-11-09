import { httpClient } from "@/shared/api/httpClient";
import type { WorkflowAiAnalysis, WorkflowAiRequest } from "../lib/workflowAi";

// US15 (RF-17, RF-18): el backend pregunta a la IA y devuelve propuestas validadas; no guarda nada.
export const workflowAiService = {
  analyze: (request: WorkflowAiRequest, signal?: AbortSignal) =>
    httpClient.post<WorkflowAiAnalysis>("/ai/workflow/analyze", request, signal),
};
