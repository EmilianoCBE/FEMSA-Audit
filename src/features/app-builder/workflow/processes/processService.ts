import { httpClient } from "@/shared/api/httpClient";
import type { ProcessDetail, ProcessStatus, ProcessSummary, TransitionInput } from "./types";

// Fase 4 del workflow: procesos en operación (/api/workflow).
export const processService = {
  list: async (appId: string, status: ProcessStatus | undefined, signal?: AbortSignal) => {
    const query = new URLSearchParams({ appId, ...(status && { status }) });
    return (await httpClient.get<{ instances: ProcessSummary[] }>(`/workflow/instances?${query}`, signal)).instances;
  },
  get: async (id: string, signal?: AbortSignal) =>
    (await httpClient.get<{ instance: ProcessDetail }>(`/workflow/instances/${encodeURIComponent(id)}`, signal))
      .instance,
  start: async (appId: string, title: string) =>
    (await httpClient.post<{ instance: ProcessSummary }>("/workflow/instances", { appId, title })).instance,
  transition: async (id: string, input: TransitionInput) =>
    (
      await httpClient.post<{ instance: ProcessDetail }>(
        `/workflow/instances/${encodeURIComponent(id)}/transitions`,
        input,
      )
    ).instance,
  /** Procesos en curso por versión (para avisar al publicar). */
  summary: async (appId: string, signal?: AbortSignal) =>
    (
      await httpClient.get<{ activeByVersion: { appVersionId: number; versionNumber: number; active: number }[] }>(
        `/workflow/instances/summary?appId=${encodeURIComponent(appId)}`,
        signal,
      )
    ).activeByVersion,
};
