import { ChevronDown } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button } from "@/shared/ui";
import { buildSuggestionListView, DEFAULT_PAGE_SIZE } from "../lib/suggestionList";

// Lista compacta de sugerencias del asistente (Designer y Workflow). Cada tarjeta se pliega a una línea; solo una
// está abierta a la vez; se muestran 5 pendientes y las decididas se juntan abajo, plegadas.

type SuggestionListProps<T extends { id: string }> = {
  items: readonly T[];
  /** Decisión tomada por id; sin decisión = pendiente. */
  decisions: Readonly<Record<string, string | undefined>>;
  /** Badges que se ven con la tarjeta plegada (tipo, origen). */
  renderBadges: (item: T) => ReactNode;
  getTitle: (item: T) => string;
  /** Explicación, cambio propuesto y acciones: solo con la tarjeta abierta. */
  renderDetails: (item: T) => ReactNode;
  /** Texto corto de la decisión para la lista de decididas. */
  decisionLabel: (decision: string) => string;
  emptyText: string;
  /** Aviso de la última decisión (se anuncia a lectores de pantalla). */
  announcement?: string;
  pageSize?: number;
};

export function SuggestionList<T extends { id: string }>({
  items,
  decisions,
  renderBadges,
  getTitle,
  renderDetails,
  decisionLabel,
  emptyText,
  announcement,
  pageSize = DEFAULT_PAGE_SIZE,
}: SuggestionListProps<T>) {
  const [limit, setLimit] = useState(pageSize);
  const [expanded, setExpanded] = useState<string | null>();
  const listId = useId();
  const view = buildSuggestionListView(items, (item) => Boolean(decisions[item.id]), { limit, expanded });

  if (items.length === 0) {
    return <p className="text-label text-muted">{emptyText}</p>;
  }

  const percent = Math.round((view.reviewed / view.total) * 100);

  return (
    <div>
      <div className="mb-2.5">
        <div className="flex items-baseline justify-between text-label text-muted">
          <span>
            {view.reviewed} de {view.total} revisadas
          </span>
          {view.pending.length > 0 && <span>{view.pending.length} pendientes</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Sugerencias revisadas"
          aria-valuemin={0}
          aria-valuemax={view.total}
          aria-valuenow={view.reviewed}
          className="mt-1 h-1 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {announcement && (
        <p
          role="status"
          aria-label="Última decisión"
          className="mb-2.5 rounded-md border border-line-2 bg-nav px-2.5 py-1.5 text-label text-ink-2"
        >
          {announcement}
        </p>
      )}

      {view.pending.length === 0 ? (
        <p className="mb-2.5 text-label text-muted">Revisaste todas las sugerencias.</p>
      ) : (
        <ul aria-label="Sugerencias pendientes" className="space-y-1.5">
          {view.visible.map((item) => {
            const open = view.expandedId === item.id;
            const detailsId = `${listId}-${item.id}`;
            return (
              <li
                key={item.id}
                aria-label={getTitle(item)}
                className={`rounded-md border bg-surface ${open ? "border-accent-line shadow-sm" : "border-line"}`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={detailsId}
                  onClick={() => setExpanded(open ? null : item.id)}
                  className="flex w-full items-start gap-2 px-2.5 py-2 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex flex-wrap items-center gap-1">{renderBadges(item)}</span>
                    <span className={`block text-body-sm/[1.35] font-medium text-ink ${open ? "" : "line-clamp-2"}`}>
                      {getTitle(item)}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    size={16}
                    className={`mt-0.5 flex-none text-muted transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div id={detailsId} className="border-t border-line px-2.5 pb-2.5 pt-2">
                    {renderDetails(item)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(view.hidden > 0 || limit > pageSize) && (
        <div className="mt-2 flex gap-2">
          {view.hidden > 0 && (
            <Button size="sm" className="flex-1" onClick={() => setLimit(limit + pageSize)}>
              Mostrar {Math.min(pageSize, view.hidden)} más (quedan {view.hidden})
            </Button>
          )}
          {limit > pageSize && (
            <Button size="sm" onClick={() => setLimit(pageSize)}>
              Mostrar menos
            </Button>
          )}
        </div>
      )}

      {view.decided.length > 0 && (
        <details className="group mt-3 rounded-md border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-2.5 py-2 text-label font-medium text-muted">
            Ya decididas ({view.decided.length})
            <ChevronDown aria-hidden size={14} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul aria-label="Sugerencias decididas" className="divide-y divide-line border-t border-line">
            {view.decided.map((item) => (
              <li key={item.id} aria-label={getTitle(item)} className="px-2.5 py-1.5">
                <span className="block text-label text-ink-2 line-clamp-1">{getTitle(item)}</span>
                <span className="text-label font-medium text-muted">{decisionLabel(decisions[item.id] as string)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
