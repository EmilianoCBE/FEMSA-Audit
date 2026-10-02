import type { ReactNode } from "react";
import type { QueryResult } from "@/shared/hooks/useQuery";
import { Button } from "./Button";

type QueryStateProps<T> = {
  query: QueryResult<T>;
  children: (data: T) => ReactNode;
};

/** Pinta carga, error (con reintento) o el contenido. Evita repetir estos tres estados en cada pantalla. */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  if (query.error) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-md border border-red-line bg-red-bg px-3.5 py-3 text-body-sm text-red"
      >
        {query.error.message}
        <Button variant="link" size="sm" className="ml-auto text-red" onClick={query.reload}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (query.isLoading && query.data === undefined) {
    return (
      <div role="status" className="py-10 text-center text-body-sm text-muted">
        Cargando…
      </div>
    );
  }

  return query.data === undefined ? null : children(query.data);
}
