import type { TabRoute } from "@/shared/routing/createTabbedRoute";
import { VersionHistoryPanel } from "../version-history";
import { FlowPanel } from "./panels/FlowPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { RulesPanel } from "./panels/RulesPanel";

/** Tabs de la pantalla Workflow. El orden aquí es el orden en pantalla. */
export const WORKFLOW_TABS: readonly TabRoute[] = [
  { path: "flow", label: "Estados y transiciones", element: <FlowPanel /> },
  { path: "rules", label: "Reglas", element: <RulesPanel /> },
  { path: "notifications", label: "Notificaciones", element: <NotificationsPanel /> },
  { path: "history", label: "Historial de versiones", element: <VersionHistoryPanel /> },
];
