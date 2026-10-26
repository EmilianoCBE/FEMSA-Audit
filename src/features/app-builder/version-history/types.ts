import type { ElementoDesigner } from "../designer/types";

export type VersionStatus = "draft" | "current" | "archived";

export type AppVersion = {
  id: string;
  version: string;
  /** Fecha ISO de publicación; `null` si la versión sigue en edición. */
  publishedAt: string | null;
  status: VersionStatus;
  author: string;
  changes: readonly string[];
  /** Versión de la que se restauró la configuración (ej. "v3"), si aplica. */
  restoredFrom?: string | null;
};

/** Configuración de la aplicación que se guarda en cada versión. */
export type AppConfig = {
  elements?: ElementoDesigner[];
  [key: string]: unknown;
};

export type AppVersionDetail = AppVersion & { config: AppConfig };
