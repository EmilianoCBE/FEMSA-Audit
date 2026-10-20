import { httpClient } from "@/shared/api/httpClient";
import type { DesignerAnalysis } from "../types";

// US15-US17 - Emiliano Carrizales: el backend analiza el formulario guardado y solo devuelve propuestas.
export const assistantService = {
  analyzeDesigner: (appId: string) => httpClient.post<DesignerAnalysis>("/ai/designer/analyze", { appId }),
};
