import { createTabbedRoute } from "@/shared/routing/createTabbedRoute";
import { ROUTES } from "@/shared/routing/routes";
import { DesignerPage } from "./pages/DesignerPage";
import { DESIGNER_TABS } from "./tabs";

export const designerRoute = createTabbedRoute({
  path: ROUTES.appBuilder.designer,
  element: <DesignerPage />,
  breadcrumb: ["Configuración", "App Builder", "Designer"],
  tabs: DESIGNER_TABS,
});
