import { versionsMock } from "../data/versions.mock";
import type { AppVersion } from "../types";

// Mock por ahora; con tablas: `list: (signal) => httpClient.get<AppVersion[]>("/versions", signal)`.
export const versionsService = {
  list: async (_signal?: AbortSignal): Promise<AppVersion[]> => versionsMock,
};
