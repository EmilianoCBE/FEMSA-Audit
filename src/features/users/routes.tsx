import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { RouteHandle } from "@/shared/routing/handle";
import { UsersPage } from "./pages/UsersPage";

function RequireAdmin() {
  const user = useCurrentUser();

  if (user.role !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  return <UsersPage />;
}

export const usersRoutes: RouteObject[] = [
  {
    path: "/users",
    element: <RequireAdmin />,
    handle: {
      breadcrumb: ["Configuración", "Usuarios y roles"],
    } satisfies RouteHandle,
  },
];
