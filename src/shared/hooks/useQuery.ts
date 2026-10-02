import { useCallback, useEffect, useState } from "react";

export type QueryResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  /** Vuelve a pedir los datos (ej. botón "Reintentar"). */
  reload: () => void;
  /** Reemplaza los datos localmente, para reflejar un cambio sin volver a pedirlos. */
  setData: (updater: (current: T | undefined) => T | undefined) => void;
};

/**
 * Carga datos asíncronos con estados de carga y error. Cancela la petición si el componente
 * se desmonta o si cambia la consulta, para no pintar respuestas viejas.
 *
 * `fetcher` debe ser estable (función de módulo o envuelta en useCallback).
 */
export function useQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>): QueryResult<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(undefined);

    fetcher(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason : new Error(String(reason)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [fetcher, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, error, isLoading, reload, setData };
}
