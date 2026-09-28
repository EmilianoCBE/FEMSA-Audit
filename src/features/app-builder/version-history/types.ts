export type VersionStatus = "draft" | "current" | "archived";

export type AppVersion = {
  id: string;
  version: string;
  date: string;
  status: VersionStatus;
  author: string;
  changes: readonly string[];
};
