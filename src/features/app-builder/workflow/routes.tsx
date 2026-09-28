import { createTabbedRoute } from "@/shared/routing/createTabbedRoute";
import { ROUTES } from "@/shared/routing/routes";
import { WorkflowPage } from "./pages/WorkflowPage";
import { WORKFLOW_TABS } from "./tabs";

export const workflowRoute = createTabbedRoute({
  path: ROUTES.appBuilder.workflow,
  element: <WorkflowPage />,
  breadcrumb: ["Configuración", "App Builder", "Workflow"],
  tabs: WORKFLOW_TABS,
});
