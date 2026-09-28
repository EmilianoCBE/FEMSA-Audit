import { Navigate, type RouteObject } from "react-router";
import { ROUTES } from "@/shared/routing/routes";
import { designerRoute } from "./designer/routes";
import { workflowRoute } from "./workflow/routes";

/** Rutas del módulo App Builder (Equipo A). */
export const appBuilderRoutes: RouteObject[] = [
  { path: ROUTES.appBuilder.root, element: <Navigate to={ROUTES.appBuilder.workflow} replace /> },
  workflowRoute,
  designerRoute,
];
