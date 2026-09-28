import { createBrowserRouter, Navigate } from "react-router";
import { appBuilderRoutes } from "@/features/app-builder/routes";
import { inboxRoutes } from "@/features/inbox/routes";
import { ROUTES } from "@/shared/routing/routes";
import { AppLayout } from "./layout/AppLayout";

/**
 * Composición de rutas: cada feature expone sus propias rutas y aquí solo se ensamblan.
 * Para un módulo nuevo: crea `features/<modulo>/routes.tsx` y agrégalo a `children`.
 */
export const router = createBrowserRouter([
  {
    // TODO(US01 - Rafael Valdez): envolver en un guard de autenticación (Microsoft Entra ID).
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.appBuilder.workflow} replace /> },
      ...inboxRoutes,
      ...appBuilderRoutes,
      { path: "*", element: <Navigate to={ROUTES.home} replace /> },
    ],
  },
]);
