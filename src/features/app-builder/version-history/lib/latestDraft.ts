import type { AppVersion } from "../types";

/** Borrador más reciente de la aplicación (el de mayor número de versión), si existe. */
export function latestDraft(versions: readonly AppVersion[]): AppVersion | undefined {
  return versions
    .filter((version) => version.status === "draft")
    .reduce<AppVersion | undefined>(
      (latest, version) => (!latest || versionNumber(version) > versionNumber(latest) ? version : latest),
      undefined,
    );
}

const versionNumber = (version: AppVersion) => Number(version.version.replace(/^v/i, "")) || 0;
