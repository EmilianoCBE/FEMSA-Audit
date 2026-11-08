import { httpClient } from "@/shared/api/httpClient";
import type {
  ControlEvaluationHistory,
  CreateControlEvaluationRequest,
  CreateControlEvaluationResponse,
  RiskWithControlsDetail,
  RiskWithControlsSummary,
} from "../types/controlEvaluation.types";

export const controlEvaluationService = {
  async getRisks(signal?: AbortSignal) {
    return httpClient.get<{ risks: RiskWithControlsSummary[] }>(
      "/control-evaluations/risks",
      signal,
    );
  },

  async getRiskDetail(riskTrackingId: string, signal?: AbortSignal) {
    return httpClient.get<RiskWithControlsDetail>(
      `/control-evaluations/risk/${encodeURIComponent(riskTrackingId)}`,
      signal,
    );
  },

  async getControlHistory(controlId: number, signal?: AbortSignal) {
    return httpClient.get<ControlEvaluationHistory>(
      `/control-evaluations/control/${controlId}`,
      signal,
    );
  },

  async createEvaluation(data: CreateControlEvaluationRequest) {
    return httpClient.post<CreateControlEvaluationResponse>(
      "/control-evaluations",
      data,
    );
  },
};