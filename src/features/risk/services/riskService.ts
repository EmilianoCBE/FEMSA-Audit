import { httpClient } from "@/shared/api/httpClient";
import type { RiskClassificationRequest, RiskClassificationResponse } from "../types";

export const riskService = {
  classify: (data: RiskClassificationRequest) => httpClient.post<RiskClassificationResponse>("/risks/classify", data),
};
