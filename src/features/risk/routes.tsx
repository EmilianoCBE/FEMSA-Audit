import type { RouteObject } from "react-router";
import type { RouteHandle } from "@/shared/routing/handle";
import { RiskClassificationPage } from "./pages/RiskClassificationPage";
import { ControlEvaluationPage } from "./pages/ControlEvaluationPage";

export const riskRoutes: RouteObject[] = [
  {
    path: "/riesgos/clasificacion",
    element: <RiskClassificationPage />,
    handle: {
      breadcrumb: ["Gestión de auditoría", "Clasificación de riesgos"],
    } satisfies RouteHandle,
  },
  {
    path: "/riesgos/evaluacion-controles",
    element: <ControlEvaluationPage />,
    handle: {
      breadcrumb: ["Gestión de auditoría", "Evaluación por controles"],
    } satisfies RouteHandle,
  },
];
