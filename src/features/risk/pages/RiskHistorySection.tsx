
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GitCompareArrows,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { riskService } from "../services/riskService";
import type {
  RiskEvaluationFilters,
  RiskEvaluationHistoryItem,
  RiskEvaluationSummary,
} from "../services/riskService";

type Props = {
  refreshKey?: number;
};

const LEVELS = ["Bajo", "Medio", "Alto", "Crítico"];

function levelStyle(level: string) {
  switch (level) {
    case "Bajo":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Medio":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Alto":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "Crítico":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-line bg-nav text-ink";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return value;
  }

  return new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "2-digit",
  });
}

function BarList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: { label: string; count: number }[];
}) {
  const maxValue = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h3 className="m-0 text-body font-semibold text-ink">
          {title}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="py-5 text-center text-body-sm text-muted">
          No hay datos para los filtros seleccionados.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="break-words text-body-sm text-ink">
                  {item.label}
                </span>
                <span className="shrink-0 text-body-sm font-semibold text-ink">
                  {item.count}
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-nav"
                role="img"
                aria-label={`${item.label}: ${item.count}`}
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${(item.count / maxValue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function RiskHistorySection({ refreshKey = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [draft, setDraft] = useState<RiskEvaluationFilters>({
    search: "",
    department: "",
    level: "",
    fromDate: "",
    toDate: "",
  });

  const [filters, setFilters] = useState<RiskEvaluationFilters>({
    page: 1,
    pageSize: 10,
  });

  const [evaluations, setEvaluations] = useState<
    RiskEvaluationHistoryItem[]
  >([]);

  const [summary, setSummary] =
    useState<RiskEvaluationSummary | null>(null);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de comparación.
  const [compareRiskId, setCompareRiskId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<
    RiskEvaluationHistoryItem[] | null
  >(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Estado del seguimiento individual.
  const [followRiskId, setFollowRiskId] = useState<string | null>(null);
  const [followEvaluations, setFollowEvaluations] = useState<
    RiskEvaluationHistoryItem[] | null
  >(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  async function loadData(currentFilters: RiskEvaluationFilters) {
    setLoading(true);
    setError(null);

    try {
      const [historyResponse, summaryResponse] = await Promise.all([
        riskService.getEvaluations(currentFilters),
        riskService.getSummary(currentFilters),
      ]);

      setEvaluations(historyResponse.evaluations);
      setTotal(historyResponse.total);
      setTotalPages(historyResponse.totalPages);
      setSummary(summaryResponse);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el historial y sus indicadores."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(filters);
    // refreshKey permite actualizar el historial después de guardar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, refreshKey]);

  function applyFilters() {
    setCompareRiskId(null);
    setComparison(null);
    setCompareError(null);

    setFollowRiskId(null);
    setFollowEvaluations(null);
    setFollowError(null);

    setFilters({
      search: draft.search?.trim() ?? "",
      department: draft.department ?? "",
      level: draft.level ?? "",
      fromDate: draft.fromDate ?? "",
      toDate: draft.toDate ?? "",
      page: 1,
      pageSize: 10,
    });
  }

  function resetFilters() {
    const clean: RiskEvaluationFilters = {
      search: "",
      department: "",
      level: "",
      fromDate: "",
      toDate: "",
      page: 1,
      pageSize: 10,
    };

    setDraft(clean);
    setFilters(clean);

    setCompareRiskId(null);
    setComparison(null);
    setCompareError(null);

    setFollowRiskId(null);
    setFollowEvaluations(null);
    setFollowError(null);
  }

  async function handleFollow(riskLibraryId: string) {
    if (followRiskId === riskLibraryId) {
      setFollowRiskId(null);
      setFollowEvaluations(null);
      setFollowError(null);
      return;
    }

    setFollowRiskId(riskLibraryId);
    setFollowEvaluations(null);
    setFollowError(null);
    setFollowLoading(true);

    try {
      const response = await riskService.getEvaluationsByRiskId(
        riskLibraryId,
        100
      );

      setFollowEvaluations(response.evaluations);
    } catch (err) {
      setFollowError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el seguimiento de este riesgo."
      );
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleCompare(riskLibraryId: string) {
    if (compareRiskId === riskLibraryId) {
      setCompareRiskId(null);
      setComparison(null);
      setCompareError(null);
      return;
    }

    setCompareRiskId(riskLibraryId);
    setComparison(null);
    setCompareError(null);
    setCompareLoading(true);

    try {
      const response =
        await riskService.compareEvaluations(riskLibraryId);

      setComparison(response.evaluations);
    } catch (err) {
      setCompareError(
        err instanceof ApiError
          ? err.message
          : "No se pudo consultar la comparación."
      );
    } finally {
      setCompareLoading(false);
    }
  }

  const departments = Array.from(
    new Set(
      (summary?.byDepartment ?? [])
        .map((item) => item.label)
        .filter(
          (label) => label && label !== "Sin departamento"
        )
    )
  );

  // El backend devuelve las evaluaciones de comparación
  // de la más reciente a la más antigua.
  const latest = comparison?.[0];
  const previous = comparison?.[1];

  const scoreDifference =
    latest && previous
      ? latest.risk_score - previous.risk_score
      : null;

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  return (
    <section className="overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="risk-history-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-nav focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="rounded-md border border-line bg-nav p-2 text-accent">
            <History size={20} />
          </span>

          <span>
            <span className="block text-body font-semibold text-ink">
              Historial y análisis de riesgos
            </span>
            <span className="mt-1 block text-body-sm text-muted">
              Indicadores, evaluaciones anteriores y comparación de resultados.
            </span>
          </span>
        </span>

        {isOpen ? (
          <ChevronUp size={20} className="shrink-0 text-muted" />
        ) : (
          <ChevronDown size={20} className="shrink-0 text-muted" />
        )}
      </button>

      {isOpen && (
        <div
          id="risk-history-panel"
          className="space-y-5 border-t border-line p-4"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-line-2 p-3 text-body-sm text-ink"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Indicadores */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">
                Evaluaciones
              </p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {loading && !summary
                  ? "…"
                  : summary?.totalEvaluations ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">
                Según los filtros aplicados.
              </p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">
                Nivel crítico
              </p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {summary?.byLevel.find(
                  (item) => item.label === "Crítico"
                )?.count ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">
                Evaluaciones clasificadas como críticas.
              </p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">
                Nivel alto
              </p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {summary?.byLevel.find(
                  (item) => item.label === "Alto"
                )?.count ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">
                Evaluaciones que requieren atención.
              </p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">
                Página actual
              </p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {page} / {Math.max(1, totalPages)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Registros mostrados abajo.
              </p>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <BarList
              title="Por nivel de riesgo"
              icon={<BarChart3 size={18} />}
              items={summary?.byLevel ?? []}
            />

            <BarList
              title="Por departamento"
              icon={<BarChart3 size={18} />}
              items={summary?.byDepartment ?? []}
            />

            <BarList
              title="Tendencia mensual"
              icon={<CalendarClock size={18} />}
              items={(summary?.monthlyTrend ?? []).map((item) => ({
                label: formatMonth(item.month),
                count: item.count,
              }))}
            />
          </div>

          {/* Filtros */}
          <section className="rounded-md border border-line p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 text-body font-semibold text-ink">
                Buscar y filtrar evaluaciones
              </h3>
              <span className="text-xs text-muted">
                {total} registros encontrados
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="history-search"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Riesgo
                </label>

                <div className="flex items-center gap-2 rounded-[5px] border border-line-2 px-3">
                  <Search size={16} className="shrink-0 text-muted" />
                  <input
                    id="history-search"
                    value={draft.search ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    placeholder="Nombre o ID del riesgo"
                    className="w-full min-w-0 bg-transparent py-2 text-body-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="history-department"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Departamento
                </label>

                <select
                  id="history-department"
                  value={draft.department ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink"
                >
                  <option value="">Todos</option>
                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                  {draft.department &&
                    !departments.includes(draft.department) && (
                      <option value={draft.department}>
                        {draft.department}
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="history-level"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Nivel
                </label>

                <select
                  id="history-level"
                  value={draft.level ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      level: event.target.value,
                    }))
                  }
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink"
                >
                  <option value="">Todos los niveles</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="history-from"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Desde
                </label>

                <input
                  id="history-from"
                  type="date"
                  value={draft.fromDate ?? ""}
                  max={draft.toDate || undefined}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fromDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="history-to"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Hasta
                </label>

                <input
                  id="history-to"
                  type="date"
                  value={draft.toDate ?? ""}
                  min={draft.fromDate || undefined}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      toDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex-1 rounded-md bg-accent px-3 py-2 text-body-sm font-medium text-white hover:opacity-90"
                >
                  Aplicar filtros
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  title="Limpiar filtros"
                  aria-label="Limpiar filtros"
                  className="rounded-md border border-line-2 p-2 text-ink hover:bg-nav"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </section>

          {/* Historial general */}
          <section className="overflow-hidden rounded-md border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-nav px-4 py-3">
              <div>
                <h3 className="m-0 text-body font-semibold text-ink">
                  Historial de evaluaciones
                </h3>
                <p className="mt-1 text-xs text-muted">
                 Detalle desglosado de cada evaluación.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadData(filters)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm font-medium text-ink disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Actualizar
              </button>
            </div>

            {loading ? (
              <div
                role="status"
                className="p-8 text-center text-body-sm text-muted"
              >
                Cargando evaluaciones…
              </div>
            ) : evaluations.length === 0 ? (
              <div className="p-8 text-center text-body-sm text-muted">
                No hay evaluaciones que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-nav">
                      {[
                        "Riesgo",
                        "Departamento",
                        "Prob. / impacto",
                        "Puntaje",
                        "Nivel",
                        "Evaluado por",
                        "Fecha",
                        "Acciones",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-3 py-3 text-xs font-semibold text-muted"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {evaluations.map((item) => (
                      <tr
                        key={item.evaluation_id}
                        className="border-b border-line last:border-b-0"
                      >
                        <td className="px-3 py-3">
                          <p className="m-0 max-w-[220px] break-words text-body-sm font-medium text-ink">
                            {item.risk_name}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {item.risk_library_id}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">
                          {item.audit_department || "Sin departamento"}
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">
                          {item.probability} / {item.impact}
                        </td>

                        <td className="px-3 py-3 text-body-sm font-semibold text-ink">
                          {item.risk_score}/25
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${levelStyle(item.risk_level)}`}
                          >
                            {item.risk_level}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">
                          {item.evaluated_by_name || "No disponible"}
                        </td>

                        <td className="px-3 py-3 text-xs text-muted">
                          {formatDate(item.created_at)}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleFollow(item.risk_library_id)
                              }
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-2 px-2.5 py-2 text-xs font-medium text-ink hover:bg-nav"
                            >
                              <History size={14} />
                              {followRiskId === item.risk_library_id
                                ? "Cerrar seguimiento"
                                : "Seguimiento"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleCompare(item.risk_library_id)
                              }
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-2 px-2.5 py-2 text-xs font-medium text-ink hover:bg-nav"
                            >
                              <GitCompareArrows size={14} />
                              {compareRiskId === item.risk_library_id
                                ? "Cerrar comparación"
                                : "Comparar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="m-0 text-xs text-muted">
                {total === 0
                  ? "Sin registros"
                  : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(
                      page * pageSize,
                      total
                    )} de ${total}`}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.max(1, (current.page ?? 1) - 1),
                    }))
                  }
                  className="rounded-md border border-line-2 p-2 text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-body-sm text-ink">
                  Página {page} de {Math.max(1, totalPages)}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: (current.page ?? 1) + 1,
                    }))
                  }
                  className="rounded-md border border-line-2 p-2 text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>

          {/* Seguimiento individual */}
          {followRiskId && (
            <section className="rounded-md border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="m-0 text-body font-semibold text-ink">
                    Seguimiento del riesgo
                  </h3>
                  <p className="mt-1 text-body-sm text-muted">
                    Historial del riesgo: {followRiskId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFollowRiskId(null);
                    setFollowEvaluations(null);
                    setFollowError(null);
                  }}
                  className="rounded-md border border-line-2 p-2 text-muted hover:bg-nav"
                  aria-label="Cerrar seguimiento"
                >
                  <X size={17} />
                </button>
              </div>

              {followLoading ? (
                <p
                  role="status"
                  className="mt-4 text-body-sm text-muted"
                >
                  Cargando historial del riesgo…
                </p>
              ) : followError ? (
                <p role="alert" className="mt-4 text-body-sm text-ink">
                  {followError}
                </p>
              ) : !followEvaluations ||
                followEvaluations.length === 0 ? (
                <p className="mt-4 text-body-sm text-muted">
                  Este riesgo todavía no tiene evaluaciones registradas.
                </p>
              ) : (
                <>
                  <p className="mt-4 text-body-sm text-muted">
                    Se encontraron {followEvaluations.length} evaluación(es),
                    ordenadas de la más reciente a la más antigua.
                  </p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[750px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-nav">
                          {[
                            "Fecha",
                            "Probabilidad",
                            "Impacto",
                            "Puntaje",
                            "Nivel",
                            "Evaluado por",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-3 py-3 text-xs font-semibold text-muted"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {followEvaluations.map((item) => (
                          <tr
                            key={item.evaluation_id}
                            className="border-b border-line last:border-b-0"
                          >
                            <td className="px-3 py-3 text-xs text-muted">
                              {formatDate(item.created_at)}
                            </td>

                            <td className="px-3 py-3 text-body-sm text-ink">
                              {item.probability}/5
                            </td>

                            <td className="px-3 py-3 text-body-sm text-ink">
                              {item.impact}/5
                            </td>

                            <td className="px-3 py-3 text-body-sm font-semibold text-ink">
                              {item.risk_score}/25
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${levelStyle(item.risk_level)}`}
                              >
                                {item.risk_level}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-body-sm text-ink">
                              {item.evaluated_by_name || "No disponible"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Comparación de las dos evaluaciones más recientes */}
          {compareRiskId && (
            <section className="rounded-md border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="m-0 text-body font-semibold text-ink">
                    Comparación de evaluaciones
                  </h3>
                  <p className="mt-1 text-body-sm text-muted">
                    Riesgo seleccionado: {compareRiskId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCompareRiskId(null);
                    setComparison(null);
                    setCompareError(null);
                  }}
                  className="rounded-md border border-line-2 p-2 text-muted hover:bg-nav"
                  aria-label="Cerrar comparación"
                >
                  <X size={17} />
                </button>
              </div>

              {compareLoading ? (
                <p
                  role="status"
                  className="mt-4 text-body-sm text-muted"
                >
                  Consultando evaluaciones anteriores…
                </p>
              ) : compareError ? (
                <p role="alert" className="mt-4 text-body-sm text-ink">
                  {compareError}
                </p>
              ) : !comparison || comparison.length < 2 ? (
                <p className="mt-4 text-body-sm text-muted">
                  Este riesgo todavía no tiene dos evaluaciones para comparar.
                  Registra otra evaluación para consultar su evolución.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[latest, previous].map((item, index) =>
                      item ? (
                        <div
                          key={item.evaluation_id}
                          className="rounded-md border border-line bg-nav p-4"
                        >
                          <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
                            {index === 0
                              ? "Evaluación más reciente"
                              : "Evaluación anterior"}
                          </p>

                          <p className="mt-2 text-body font-semibold text-ink">
                            {item.risk_name}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {formatDate(item.created_at)}
                          </p>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">
                                Prob.
                              </p>
                              <p className="mt-1 font-semibold text-ink">
                                {item.probability}/5
                              </p>
                            </div>

                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">
                                Impacto
                              </p>
                              <p className="mt-1 font-semibold text-ink">
                                {item.impact}/5
                              </p>
                            </div>

                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">
                                Puntaje
                              </p>
                              <p className="mt-1 font-semibold text-ink">
                                {item.risk_score}/25
                              </p>
                            </div>
                          </div>

                          <span
                            className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${levelStyle(item.risk_level)}`}
                          >
                            {item.risk_level}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>

                  <div className="mt-3 rounded-md border border-line bg-surface p-4">
                    <p className="m-0 text-body-sm font-medium text-ink">
                      Cambio en el puntaje
                    </p>

                    <p className="mt-1 text-body-sm text-muted">
                      {scoreDifference === 0
                        ? "El puntaje se mantuvo sin cambios."
                        : scoreDifference !== null && scoreDifference > 0
                          ? `El puntaje aumentó ${scoreDifference} puntos.`
                          : scoreDifference !== null
                            ? `El puntaje disminuyó ${Math.abs(scoreDifference)} puntos.`
                            : "No hay suficientes datos para calcular el cambio."}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Un cambio en el puntaje no determina por sí solo si el
                      riesgo está resuelto; debe interpretarse junto con el
                      contexto y los controles aplicados.
                    </p>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </section>
  );
}

