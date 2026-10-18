import { httpClient } from "@/shared/api/httpClient";

export interface RiskLibraryItem {
  risk_library_id: string;
  risk_name: string;
  audit_department: string | null;
  created_at: string;
}

export interface RiskLibraryResponse {
  count: number;
  risks: RiskLibraryItem[];
}

export const riskLibraryService = {
  getAll: (filters?: { search?: string; department?: string }) => {
    const params = new URLSearchParams();

    if (filters?.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters?.department?.trim()) {
      params.set("department", filters.department.trim());
    }

    const query = params.toString();
    const endpoint = query ? `/risk-library?${query}` : "/risk-library";

    return httpClient.get<RiskLibraryResponse>(endpoint);
  },

  getById: (id: string) => httpClient.get<{ risk: RiskLibraryItem }>(`/risk-library/${encodeURIComponent(id)}`),
};
