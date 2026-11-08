import { httpClient } from "@/shared/api/httpClient";
import type { AppConfig, AppVersionDetail, RestoreResult, VersionHistory } from "../types";

type VersionResponse = { version: AppVersionDetail };

/** `appId` es el id de la plantilla del Designer. */
const versionsPath = (appId: string) => `/apps/${encodeURIComponent(appId)}/versions`;
const versionPath = (appId: string, versionId: string) => `${versionsPath(appId)}/${encodeURIComponent(versionId)}`;

// US11 - Rafael Valdez: historial de versiones de la aplicación.
export const versionsService = {
  /** Historial, estado del Designer respecto a él y si la sesión puede modificarlo. */
  list: (appId: string, signal?: AbortSignal): Promise<VersionHistory> =>
    httpClient.get<VersionHistory>(versionsPath(appId), signal),

  get: async (appId: string, versionId: string, signal?: AbortSignal): Promise<AppVersionDetail> =>
    (await httpClient.get<VersionResponse>(versionPath(appId, versionId), signal)).version,

  save: async (appId: string, config: AppConfig, changes: string[]): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(versionsPath(appId), { config, changes })).version,

  publish: async (appId: string, versionId: string): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(`${versionPath(appId, versionId)}/publish`, {})).version,

  /** Descarta un borrador: sale del historial, pero su número no se reutiliza. */
  discard: async (appId: string, versionId: string): Promise<AppVersionDetail> =>
    (await httpClient.post<VersionResponse>(`${versionPath(appId, versionId)}/discard`, {})).version,

  /**
   * Crea un borrador nuevo con la configuración de la versión indicada y la aplica al Designer.
   * Si el Designer tenía cambios sin versión, antes los guarda como borrador (`backup`).
   */
  restore: (appId: string, versionId: string): Promise<RestoreResult> =>
    httpClient.post<RestoreResult>(`${versionPath(appId, versionId)}/restore`, {}),
};
