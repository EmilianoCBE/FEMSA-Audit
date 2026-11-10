import type { TabRoute } from "@/shared/routing/createTabbedRoute";
import { VersionHistoryPanel } from "../version-history";
import { FlowPanel } from "./panels/FlowPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { ProcessesPanel } from "./panels/ProcessesPanel";
import { RulesPanel } from "./panels/RulesPanel";

/** Tabs de la pantalla Workflow. El orden aquí es el orden en pantalla. */
export const WORKFLOW_TABS: readonly TabRoute[] = [
  { path: "flow", label: "Estados y transiciones", element: <FlowPanel /> },
  // Fase 4: los hallazgos recorriendo el flujo (cada uno con la versión con la que empezó).
  { path: "processes", label: "Procesos", element: <ProcessesPanel /> },
  { path: "rules", label: "Reglas", element: <RulesPanel /> },
  { path: "notifications", label: "Notificaciones", element: <NotificationsPanel /> },
  { path: "history", label: "Historial de versiones", element: <VersionHistoryPanel /> },
];
