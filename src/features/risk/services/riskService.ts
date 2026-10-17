
import { httpClient } from "@/shared/api/httpClient";
import type {
  RiskClassificationRequest,
  RiskClassificationResponse,
} from "../types";

export type RiskEvaluationHistoryItem = {
  evaluation_id: number;
  risk_library_id: string;
  risk_name: string;
  audit_department: string | null;
  probability: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  evaluated_by_user_id: number | null;
  evaluated_by_name: string | null;
  created_at: string;
};

export type RiskEvaluationHistoryResponse = {
  evaluations: RiskEvaluationHistoryItem[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type RiskEvaluationsByRiskResponse = {
  evaluations: RiskEvaluationHistoryItem[];
  count: number;
};

export type RiskEvaluationFilters = {
  search?: string;
  department?: string;
  level?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export type RiskEvaluationSummary = {
  totalEvaluations: number;
  byLevel: { label: string; count: number }[];
  byDepartment: { label: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
};

export type RiskEvaluationComparisonResponse = {
  riskLibraryId: string;
  evaluations: RiskEvaluationHistoryItem[];
  canCompare: boolean;
};

function buildQuery(
  filters: RiskEvaluationFilters = {},
  includePagination = true
) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.department) {
    params.set("department", filters.department);
  }

  if (filters.level) {
    params.set("level", filters.level);
  }

  if (filters.fromDate) {
    params.set("fromDate", filters.fromDate);
  }

  if (filters.toDate) {
    params.set("toDate", filters.toDate);
  }

  if (includePagination) {
    params.set("page", String(filters.page ?? 1));
    params.set("pageSize", String(filters.pageSize ?? 10));
  }

  return params.toString();
}

export const riskService = {
  classify: (data: RiskClassificationRequest) =>
    httpClient.post<RiskClassificationResponse>(
      "/risks/classify",
      data
    ),

  saveEvaluation: (data: {
    riskLibraryId: string;
    probability: number;
    impact: number;
  }) =>
    httpClient.post("/risk-evaluations", data),

  getRecentEvaluations: (limit = 5) =>
    httpClient.get<RiskEvaluationHistoryResponse>(
      `/risk-evaluations?limit=${limit}`
    ),

  getEvaluations: (filters: RiskEvaluationFilters = {}) =>
    httpClient.get<RiskEvaluationHistoryResponse>(
      `/risk-evaluations?${buildQuery(filters)}`
    ),

  getEvaluationsByRiskId: (
    riskLibraryId: string,
    limit = 100
  ) =>
    httpClient.get<RiskEvaluationsByRiskResponse>(
      `/risk-evaluations/risk/${encodeURIComponent(riskLibraryId)}?limit=${limit}`
    ),

  getSummary: (filters: RiskEvaluationFilters = {}) =>
    httpClient.get<RiskEvaluationSummary>(
      `/risk-evaluations/summary?${buildQuery(filters, false)}`
    ),

  compareEvaluations: (riskLibraryId: string) =>
    httpClient.get<RiskEvaluationComparisonResponse>(
      `/risk-evaluations/compare/${encodeURIComponent(riskLibraryId)}`
    ),
};


