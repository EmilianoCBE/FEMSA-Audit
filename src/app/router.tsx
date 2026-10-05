import { createBrowserRouter, Navigate } from "react-router";
import { appBuilderRoutes } from "@/features/app-builder/routes";
import { inboxRoutes } from "@/features/inbox/routes";
import { usersRoutes } from "@/features/users/routes";
import { ROUTES } from "@/shared/routing/routes";
import { AppLayout } from "./layout/AppLayout";
import { RequireAuth } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/pages/LoginPage";

/**
 * Composición de rutas: cada feature expone sus propias rutas y aquí solo se ensamblan.
 * Para un módulo nuevo: crea `features/<modulo>/routes.tsx` y agrégalo a `children`.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.appBuilder.workflow} replace />,
          },
          ...inboxRoutes,
          ...appBuilderRoutes,
          ...usersRoutes,
          { path: "*", element: <Navigate to={ROUTES.home} replace /> },
        ],
      },
    ],
  },
]);