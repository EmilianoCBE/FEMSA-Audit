import type { RouteObject } from "react-router";
import type { RouteHandle } from "@/shared/routing/handle";
import { RiskClassificationPage } from "./pages/RiskClassificationPage";

export const riskRoutes: RouteObject[] = [
  {
    path: "/riesgos/clasificacion",
    element: <RiskClassificationPage />,
    handle: {
      breadcrumb: ["Gestión de auditoría", "Clasificación de riesgos"],
    } satisfies RouteHandle,
  },
];
