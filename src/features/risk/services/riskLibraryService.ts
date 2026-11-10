
import { httpClient } from "@/shared/api/httpClient";

export interface RiskLibraryItem {
  risk_library_id: string;
  risk_name: string;
  audit_department: string | null;
  created_at: string;
}

export interface AssociatedRisk {
  risk_id: number;
  tracking_id: string;
  name: string;
  category: string | null;
  inherent_level: string | null;
}


export interface RiskLibraryResponse {
  count: number;
  risks: RiskLibraryItem[];
}

export interface RiskLibraryRegisterRecord {
  risk_library_id: string;
  risk_name: string;
  audit_department: string | null;

  risk_id: number | null;
  tracking_id: string | null;
  risk_register_name: string | null;
  risk_category: string | null;
  risk_inherent_level: string | null;

  control_id: number | null;
  control_tracking_id: string | null;
  control_name: string | null;
  control_domain: string | null;

  evaluation_id: number | null;
  probability: string | null;
  impact: string | null;
  evaluation_inherent_level: string | null;
  design_rating: string | null;
  effectiveness_rating: string | null;
  control_level: string | null;
  vulnerability: string | null;
  evaluated_at: string | null;
  comments: string | null;
  evaluator_name: string | null;
}

export interface RiskLibraryRegisterResponse {
  riskLibrary: RiskLibraryItem;
  records: RiskLibraryRegisterRecord[];
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
    const endpoint = query
      ? `/risk-library?${query}`
      : "/risk-library";

    return httpClient.get<RiskLibraryResponse>(endpoint);
  },

  getById: (id: string) =>
    httpClient.get<{ risk: RiskLibraryItem }>(
      `/risk-library/${encodeURIComponent(id)}`
    ),

  getRegisterDetails: (id: string) =>
  httpClient.get<RiskLibraryRegisterResponse>(
    `/risk-library/${encodeURIComponent(id)}/register`
  ),

  
getAssociatedRisks: (id: string) =>
  httpClient.get<{ count: number; risks: AssociatedRisk[] }>(
    `/risk-library/${encodeURIComponent(id)}/register`
  ),

};
