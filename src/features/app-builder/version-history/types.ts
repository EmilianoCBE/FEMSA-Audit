import type { StoredWorkflow } from "../workflow/types";
import type { ElementoDesigner } from "../designer/types";

export type VersionStatus = "draft" | "current" | "archived" | "discarded";

export type AppVersion = {
  id: string;
  version: string;
  /** Fecha ISO en que se guardó la versión. */
  createdAt?: string | null;
  /** Fecha ISO de publicación; `null` si la versión sigue en edición. */
  publishedAt: string | null;
  /** Quién la publicó, si se publicó. */
  publishedBy?: string | null;
  status: VersionStatus;
  author: string;
  changes: readonly string[];
  /** Versión de la que se restauró la configuración (ej. "v3"), si aplica. */
  restoredFrom?: string | null;
};

/** Configuración de la aplicación que se guarda en cada versión. */
export type AppConfig = {
  elements?: ElementoDesigner[];
  /** Flujo del proceso guardado con la versión (desde la fase 1 del workflow). */
  workflow?: StoredWorkflow | null;
  [key: string]: unknown;
};

export type AppVersionDetail = AppVersion & { config: AppConfig };

export type VersionHistory = {
  versions: AppVersion[];
  designer: {
    /** Versión cuya configuración coincide con el lienzo actual del Designer. */
    versionId: string | null;
    /** El lienzo tiene cambios que no están en ninguna versión. */
    hasUnversionedChanges: boolean;
  };
  /** El rol de la sesión puede guardar, publicar, descartar y restaurar. */
  canEdit: boolean;
};

export type RestoreResult = {
  version: AppVersionDetail;
  /** Borrador con el estado previo del Designer, si tenía cambios sin versión. */
  backup: AppVersionDetail | null;
};
