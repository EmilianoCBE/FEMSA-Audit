import { findingsMock } from "../data/inbox.mock";
import type { Finding } from "../types";

/**
 * Por ahora devuelve datos mock. Cuando exista la tabla en Azure SQL, reemplaza el cuerpo por:
 *   list: (signal) => httpClient.get<Finding[]>("/findings", signal)
 * Los componentes no cambian: dependen de este servicio, no de la fuente de datos.
 */
export const findingsService = {
  list: async (_signal?: AbortSignal): Promise<Finding[]> => findingsMock,
};
