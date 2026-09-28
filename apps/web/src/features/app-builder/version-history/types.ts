export type VersionStatus = "draft" | "current" | "archived";

export type AppVersion = {
  id: string;
  version: string;
  /** Fecha ISO de publicación; `null` si la versión sigue en edición. */
  publishedAt: string | null;
  status: VersionStatus;
  author: string;
  changes: readonly string[];
};
