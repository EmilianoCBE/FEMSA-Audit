import type { RouteObject } from "react-router";
import type { RouteHandle } from "@/shared/routing/handle";
import { ROUTES } from "@/shared/routing/routes";
import { InboxPage } from "./pages/InboxPage";

export const inboxRoutes: RouteObject[] = [
  {
    path: ROUTES.inbox,
    element: <InboxPage />,
    handle: { breadcrumb: ["Gestión de auditoría", "Mi bandeja"] } satisfies RouteHandle,
  },
];
