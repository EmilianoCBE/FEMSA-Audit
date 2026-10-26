import { httpClient } from "@/shared/api/httpClient";
import type { ReportData, ReportFilters, ReportKind } from "./reportModel";

export const reportService = {
  list: (kind: ReportKind, filters: ReportFilters, signal?: AbortSignal) => {
    const query = new URLSearchParams({ kind, ...filters });
    return httpClient.get<ReportData>(`/reports?${query}`, signal);
  },
};
