// Lista de sugerencias del asistente (Designer y Workflow): qué se muestra y en qué orden, para que no se vuelva
// interminable. Todo es puro; el componente SuggestionList solo dibuja lo que esto decide.

export const DEFAULT_PAGE_SIZE = 5;

/** Ordena de forma estable por prioridad (menor primero); lo que no tiene prioridad va al final. */
export function sortByPriority<T>(items: readonly T[], priority: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, rank: priority(item) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

export type SuggestionListView<T> = {
  pending: T[];
  /** Pendientes que caben en la página actual. */
  visible: T[];
  /** Cuántas pendientes quedan ocultas por la paginación. */
  hidden: number;
  decided: T[];
  /** Cuál está abierta: la que eligió el usuario si sigue pendiente; si no, la primera pendiente visible. */
  expandedId: string | null;
  reviewed: number;
  total: number;
};

/**
 * @param expanded `undefined` = automático (la primera pendiente), `null` = el usuario cerró todas.
 */
export function buildSuggestionListView<T extends { id: string }>(
  items: readonly T[],
  isDecided: (item: T) => boolean,
  { limit = DEFAULT_PAGE_SIZE, expanded }: { limit?: number; expanded?: string | null } = {},
): SuggestionListView<T> {
  const pending = items.filter((item) => !isDecided(item));
  const decided = items.filter(isDecided);
  const visible = pending.slice(0, Math.max(limit, 0));
  const stillPending = expanded ? visible.some((item) => item.id === expanded) : false;
  const expandedId = expanded === null ? null : stillPending ? (expanded as string) : (visible[0]?.id ?? null);
  return {
    pending,
    visible,
    hidden: pending.length - visible.length,
    decided,
    expandedId,
    reviewed: decided.length,
    total: items.length,
  };
}
