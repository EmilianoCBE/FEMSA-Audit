import type { TabRoute } from "@/shared/routing/createTabbedRoute";
import { VersionHistoryPanel, versionsMock } from "../version-history";
import { FieldsPanel } from "./panels/FieldsPanel";
import { PermissionsPanel } from "./panels/PermissionsPanel";
import { ValidationsPanel } from "./panels/ValidationsPanel";

/** Tabs de la pantalla Designer. El orden aquí es el orden en pantalla. */
export const DESIGNER_TABS: readonly TabRoute[] = [
  { path: "fields", label: "Campos", element: <FieldsPanel /> },
  { path: "permissions", label: "Permisos", element: <PermissionsPanel /> },
  { path: "validations", label: "Validaciones", element: <ValidationsPanel /> },
  { path: "history", label: "Historial de versiones", element: <VersionHistoryPanel versions={versionsMock} /> },
];
