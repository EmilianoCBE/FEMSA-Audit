import { httpClient } from "@/shared/api/httpClient";
import type { AppConfig, AppVersion, AppVersionDetail } from "../types";

type VersionsResponse = { versions: AppVersion[] };
type VersionResponse = { version: AppVersionDetail };

/** `appId` es el id de la plantilla del Designer. */
const versionsPath = (appId: string) => `/apps/${encodeURIComponent(appId)}/versions`;
const versionPath = (appId: string, versionId: string) => `${versionsPath(appId)}/${encodeURIComponent(versionId)}`;

// US11 - Rafael Valdez: historial de versiones de la aplicación.
export const versionsService = {
  list: async (appId: string, signal?: AbortSignal): Promise<AppVersion[]> =>
    (await httpClient.get<VersionsResponse>(versionsPath(appId), signal)).versions,

  get: async (appId: string, versionId: string, signal?: AbortSignal): Promise<AppVersionDetail> =>
    (await httpClient.get<VersionResponse>(versionPath(appId, versionId), signal)).version,

  save: async (appId: string, config: AppConfig, changes: string[]): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(versionsPath(appId), { config, changes })).version,

  publish: async (appId: string, versionId: string): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(`${versionPath(appId, versionId)}/publish`, {})).version,

  /** Crea un borrador nuevo con la configuración de la versión indicada. */
  restore: async (appId: string, versionId: string): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(`${versionPath(appId, versionId)}/restore`, {})).version,
};
