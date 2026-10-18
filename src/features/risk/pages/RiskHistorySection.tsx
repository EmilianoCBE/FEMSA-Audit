import { useEffect, useState } from "react";
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
  PieChart,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { formatMonth, getLevelStyle, getRiskLevel, RISK_LEVELS } from "../lib/riskLevels";
import { riskService } from "../services/riskService";
import type { RiskEvaluationFilters, RiskEvaluationHistoryItem, RiskEvaluationSummary } from "../services/riskService";

type Props = {
  refreshKey?: number;
};

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

function RiskDonut({ items }: { items: { label: string; count: number }[] }) {
  const levels = [
    { label: "Bajo", color: "#00854A" },
    { label: "Medio", color: "#D6A62E" },
    { label: "Alto", color: "#64748B" },
    { label: "Crítico", color: "#A61B29" },
  ];

  const counts = levels.map((level) => ({
    ...level,
    count: Math.max(0, Number(items.find((item) => item.label === level.label)?.count ?? 0)),
  }));

  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">
          <PieChart size={18} />
        </span>
        <h3 className="m-0 text-body font-semibold text-ink">Distribución por nivel de riesgo</h3>
      </div>

      {total === 0 ? (
        <p className="py-5 text-center text-body-sm text-muted">
          No hay evaluaciones para mostrar con los filtros seleccionados.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
          <div className="relative w-full max-w-[190px] shrink-0">
            <svg
              viewBox="0 0 120 120"
              className="h-auto w-full"
              role="img"
              aria-label={`Distribución de ${total} evaluaciones por nivel de riesgo`}
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.10"
                strokeWidth="16"
              />

              {counts.map((item) => {
                const segmentLength = (item.count / total) * circumference;
                const offset = accumulated;
                accumulated += segmentLength;

                if (item.count === 0) return null;

                return (
                  <circle
                    key={item.label}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="16"
                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 60 60)"
                  >
                    <title>
                      {item.label}: {item.count} evaluaciones ({((item.count / total) * 100).toFixed(1)}%)
                    </title>
                  </circle>
                );
              })}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-ink">{total}</span>
              <span className="text-xs text-muted">Evaluaciones</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            {counts.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-body-sm text-ink">{item.label}</span>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-body-sm font-semibold text-ink">{item.count}</span>
                  <span className="ml-2 text-xs text-muted">{((item.count / total) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DepartmentRiskChart({ items }: { items: { department: string; level: string; count: number }[] }) {
  const levels = [
    { label: "Bajo", color: "#00854A" },
    { label: "Medio", color: "#D6A62E" },
    { label: "Alto", color: "#64748B" },
    { label: "Crítico", color: "#A61B29" },
  ];

  const departments = Array.from(
    items
      .reduce(
        (map, item) => {
          const department = item.department || "Sin departamento";

          if (!map.has(department)) {
            map.set(department, {
              department,
              Bajo: 0,
              Medio: 0,
              Alto: 0,
              Crítico: 0,
            });
          }

          const row = map.get(department);

          if (!row) return map;
          const level = item.level as "Bajo" | "Medio" | "Alto" | "Crítico";

          if (level in row) {
            row[level] += Number(item.count) || 0;
          }

          return map;
        },
        new Map<
          string,
          {
            department: string;
            Bajo: number;
            Medio: number;
            Alto: number;
            Crítico: number;
          }
        >(),
      )
      .values(),
  ).sort((a, b) => {
    const totalA = a.Bajo + a.Medio + a.Alto + a.Crítico;
    const totalB = b.Bajo + b.Medio + b.Alto + b.Crítico;
    return totalB - totalA;
  });

  const maxTotal = Math.max(1, ...departments.map((d) => d.Bajo + d.Medio + d.Alto + d.Crítico));

  return (
    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">
          <BarChart3 size={18} />
        </span>
        <h3 className="m-0 text-body font-semibold text-ink">Evaluaciones por departamento y nivel de riesgo</h3>
      </div>

      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2">
        {levels.map((level) => (
          <div key={level.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: level.color }} />
            <span className="text-xs text-muted">{level.label}</span>
          </div>
        ))}
      </div>

      {departments.length === 0 ? (
        <p className="py-5 text-center text-body-sm text-muted">
          No hay evaluaciones para mostrar con los filtros seleccionados.
        </p>
      ) : (
        <div className="space-y-5">
          {departments.map((department) => {
            const total = department.Bajo + department.Medio + department.Alto + department.Crítico;

            return (
              <div key={department.department}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-body-sm text-ink">{department.department}</span>
                  <span className="shrink-0 text-xs font-semibold text-muted">{total}</span>
                </div>

                <div
                  className="flex h-5 w-full overflow-hidden rounded-sm bg-surface-secondary"
                  role="img"
                  aria-label={`${department.department}: ${total} evaluaciones`}
                >
                  {levels.map((level) => {
                    const count = department[level.label as "Bajo" | "Medio" | "Alto" | "Crítico"];

                    if (count === 0 || total === 0) return null;

                    return (
                      <div
                        key={level.label}
                        title={`${level.label}: ${count}`}
                        style={{
                          width: `${(count / maxTotal) * 100}%`,
                          backgroundColor: level.color,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LineTrend({ items }: { items: { month: string; count: number }[] }) {
  const width = 520;
  const height = 190;
  const paddingX = 30;
  const paddingTop = 20;
  const paddingBottom = 42;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;

  const maxValue = Math.max(1, ...items.map((item) => item.count));

  const points = items.map((item, index) => {
    const x = items.length === 1 ? width / 2 : paddingX + (index / (items.length - 1)) * chartWidth;

    const y = paddingTop + chartHeight - (item.count / maxValue) * chartHeight;

    return { ...item, x, y };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">
          <CalendarClock size={18} />
        </span>
        <h3 className="m-0 text-body font-semibold text-ink">Tendencia mensual</h3>
      </div>

      {items.length === 0 ? (
        <p className="py-5 text-center text-body-sm text-muted">No hay datos para los filtros seleccionados.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full min-w-[300px]"
              role="img"
              aria-label="Gráfica de línea de evaluaciones por mes"
            >
              {[0, 0.5, 1].map((fraction) => {
                const y = paddingTop + chartHeight * fraction;
                const value = Math.round(maxValue * (1 - fraction));

                return (
                  <g key={fraction}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeDasharray="4 4"
                    />
                    <text x={paddingX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor">
                      {value}
                    </text>
                  </g>
                );
              })}

              {points.length > 1 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="text-accent"
                />
              )}

              {points.map((point) => (
                <g key={point.month}>
                  <circle cx={point.x} cy={point.y} r="4" fill="currentColor" className="text-accent">
                    <title>
                      {formatMonth(point.month)}: {point.count} evaluaciones
                    </title>
                  </circle>

                  <text x={point.x} y={height - 16} textAnchor="middle" fontSize="10" fill="currentColor">
                    {formatMonth(point.month)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <p className="mt-2 text-xs text-muted">Cada punto representa el total de evaluaciones del mes indicado.</p>
        </>
      )}
    </section>
  );
}

function RiskMatrix({ data = [] }: { data?: RiskEvaluationSummary["riskMatrix"] }) {
  const probabilities = [5, 4, 3, 2, 1];
  const impacts = [1, 2, 3, 4, 5];

  function getCount(probability: number, impact: number) {
    return data.find((item) => Number(item.probability) === probability && Number(item.impact) === impact)?.count ?? 0;
  }

  return (
    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="mb-4">
        <h3 className="m-0 text-body font-semibold text-ink">Matriz de probabilidad e impacto</h3>
        <p className="mt-1 text-body-sm text-muted">
          Puntaje y cantidad de evaluaciones registradas para cada combinación.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[420px] border-separate border-spacing-1 text-center"
          aria-label="Matriz de riesgos por probabilidad e impacto"
        >
          <thead>
            <tr>
              <th scope="col" className="w-24 px-1 py-2 text-xs font-medium text-muted">
                Prob. / Impacto
              </th>
              {impacts.map((impact) => (
                <th key={impact} scope="col" className="px-1 py-2 text-xs font-semibold text-ink">
                  {impact}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {probabilities.map((probability) => (
              <tr key={probability}>
                <th scope="row" className="px-2 py-1 text-xs font-semibold text-ink">
                  {probability}
                </th>

                {impacts.map((impact) => {
                  const score = probability * impact;
                  const level = getRiskLevel(score);
                  const count = getCount(probability, impact);

                  return (
                    <td key={impact} className="p-0">
                      <div
                        title={`Probabilidad: ${probability}, impacto: ${impact}, puntaje: ${score}, nivel: ${level}, evaluaciones: ${count}`}
                        className={`flex min-h-[72px] flex-col items-center justify-center rounded-md border p-1 ${getLevelStyle(level)}`}
                      >
                        <span className="text-base font-bold">{score}</span>
                        <span className="text-[10px] font-medium">{level}</span>
                        <span className="mt-1 text-xs font-semibold">
                          {count} {count === 1 ? "registro" : "registros"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "Bajo", range: "1–4" },
          { label: "Medio", range: "5–9" },
          { label: "Alto", range: "10–16" },
          { label: "Crítico", range: "17–25" },
        ].map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getLevelStyle(item.label)}`}
          >
            {item.label} ({item.range})
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Los números grandes representan el puntaje de riesgo. El número inferior representa la cantidad de evaluaciones
        registradas para esa combinación de probabilidad e impacto. Los datos respetan los filtros aplicados.
      </p>
    </section>
  );
}

export function RiskHistorySection({ refreshKey = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(true);

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

  const [evaluations, setEvaluations] = useState<RiskEvaluationHistoryItem[]>([]);

  const [summary, setSummary] = useState<RiskEvaluationSummary | null>(null);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de comparación.
  const [compareRiskId, setCompareRiskId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RiskEvaluationHistoryItem[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Estado del seguimiento individual.
  const [followRiskId, setFollowRiskId] = useState<string | null>(null);
  const [followEvaluations, setFollowEvaluations] = useState<RiskEvaluationHistoryItem[] | null>(null);
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
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial y sus indicadores.");
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
      const response = await riskService.getEvaluationsByRiskId(riskLibraryId, 100);

      setFollowEvaluations(response.evaluations);
    } catch (err) {
      setFollowError(err instanceof ApiError ? err.message : "No se pudo cargar el seguimiento de este riesgo.");
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
      const response = await riskService.compareEvaluations(riskLibraryId);

      setComparison(response.evaluations);
    } catch (err) {
      setCompareError(err instanceof ApiError ? err.message : "No se pudo consultar la comparación.");
    } finally {
      setCompareLoading(false);
    }
  }

  const departments = Array.from(
    new Set(
      (summary?.byDepartment ?? []).map((item) => item.label).filter((label) => label && label !== "Sin departamento"),
    ),
  );

  // El backend devuelve las evaluaciones de comparación
  // de la más reciente a la más antigua.
  const latest = comparison?.[0];
  const previous = comparison?.[1];

  const scoreDifference = latest && previous ? latest.risk_score - previous.risk_score : null;

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
            <span className="block text-body font-semibold text-ink">Historial y análisis de riesgos</span>
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
        <div id="risk-history-panel" className="space-y-5 border-t border-line p-4">
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
              <p className="m-0 text-body-sm text-muted">Evaluaciones</p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {loading && !summary ? "…" : (summary?.totalEvaluations ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted">Según los filtros aplicados.</p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">Nivel crítico</p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {summary?.byLevel.find((item) => item.label === "Crítico")?.count ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Evaluaciones clasificadas como críticas.</p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">Nivel alto</p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {summary?.byLevel.find((item) => item.label === "Alto")?.count ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted">Evaluaciones que requieren atención.</p>
            </div>

            <div className="rounded-md border border-line bg-nav p-4">
              <p className="m-0 text-body-sm text-muted">Puntaje promedio</p>
              <p className="mt-2 text-heading font-semibold text-ink">
                {loading && !summary ? "…" : `${Number(summary?.averageScore ?? 0).toFixed(1)}/25`}
              </p>
              <p className="mt-1 text-xs text-muted">Promedio de los puntajes de las evaluaciones filtradas.</p>
            </div>
          </div>

          {/* Matriz de riesgos */}
          <RiskMatrix data={summary?.riskMatrix ?? []} />

          {/* Gráficas */}
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <LineTrend items={summary?.monthlyTrend ?? []} />

            <RiskDonut items={summary?.byLevel ?? []} />

            <div className="lg:col-span-2">
              <DepartmentRiskChart items={summary?.byDepartmentLevel ?? []} />
            </div>
          </div>

          {/* Filtros */}
          <section className="rounded-md border border-line p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 text-body font-semibold text-ink">Buscar y filtrar evaluaciones</h3>
              <span className="text-xs text-muted">{total} registros encontrados</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="history-search" className="mb-1.5 block text-control font-medium text-ink">
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
                <label htmlFor="history-department" className="mb-1.5 block text-control font-medium text-ink">
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
                  {draft.department && !departments.includes(draft.department) && (
                    <option value={draft.department}>{draft.department}</option>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="history-level" className="mb-1.5 block text-control font-medium text-ink">
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
                  {RISK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="history-from" className="mb-1.5 block text-control font-medium text-ink">
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
                <label htmlFor="history-to" className="mb-1.5 block text-control font-medium text-ink">
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
                <h3 className="m-0 text-body font-semibold text-ink">Historial de evaluaciones</h3>
                <p className="mt-1 text-xs text-muted">Detalle desglosado de cada evaluación.</p>
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
              <div role="status" className="p-8 text-center text-body-sm text-muted">
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
                        <th key={heading} className="px-3 py-3 text-xs font-semibold text-muted">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {evaluations.map((item) => (
                      <tr key={item.evaluation_id} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-3">
                          <p className="m-0 max-w-[220px] break-words text-body-sm font-medium text-ink">
                            {item.risk_name}
                          </p>
                          <p className="mt-1 text-xs text-muted">{item.risk_library_id}</p>
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">
                          {item.audit_department || "Sin departamento"}
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">
                          {item.probability} / {item.impact}
                        </td>

                        <td className="px-3 py-3 text-body-sm font-semibold text-ink">{item.risk_score}/25</td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${getLevelStyle(item.risk_level)}`}
                          >
                            {item.risk_level}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-body-sm text-ink">{item.evaluated_by_name || "No disponible"}</td>

                        <td className="px-3 py-3 text-xs text-muted">{formatDate(item.created_at)}</td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleFollow(item.risk_library_id)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-2 px-2.5 py-2 text-xs font-medium text-ink hover:bg-nav"
                            >
                              <History size={14} />
                              {followRiskId === item.risk_library_id ? "Cerrar seguimiento" : "Seguimiento"}
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleCompare(item.risk_library_id)}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-2 px-2.5 py-2 text-xs font-medium text-ink hover:bg-nav"
                            >
                              <GitCompareArrows size={14} />
                              {compareRiskId === item.risk_library_id ? "Cerrar comparación" : "Comparar"}
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
                  : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`}
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
                  <h3 className="m-0 text-body font-semibold text-ink">Seguimiento del riesgo</h3>
                  <p className="mt-1 text-body-sm text-muted">Historial del riesgo: {followRiskId}</p>
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
                <p role="status" className="mt-4 text-body-sm text-muted">
                  Cargando historial del riesgo…
                </p>
              ) : followError ? (
                <p role="alert" className="mt-4 text-body-sm text-ink">
                  {followError}
                </p>
              ) : !followEvaluations || followEvaluations.length === 0 ? (
                <p className="mt-4 text-body-sm text-muted">Este riesgo todavía no tiene evaluaciones registradas.</p>
              ) : (
                <>
                  <p className="mt-4 text-body-sm text-muted">
                    Se encontraron {followEvaluations.length} evaluación(es), ordenadas de la más reciente a la más
                    antigua.
                  </p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[750px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-nav">
                          {["Fecha", "Probabilidad", "Impacto", "Puntaje", "Nivel", "Evaluado por"].map((heading) => (
                            <th key={heading} className="px-3 py-3 text-xs font-semibold text-muted">
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {followEvaluations.map((item) => (
                          <tr key={item.evaluation_id} className="border-b border-line last:border-b-0">
                            <td className="px-3 py-3 text-xs text-muted">{formatDate(item.created_at)}</td>

                            <td className="px-3 py-3 text-body-sm text-ink">{item.probability}/5</td>

                            <td className="px-3 py-3 text-body-sm text-ink">{item.impact}/5</td>

                            <td className="px-3 py-3 text-body-sm font-semibold text-ink">{item.risk_score}/25</td>

                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${getLevelStyle(item.risk_level)}`}
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
                  <h3 className="m-0 text-body font-semibold text-ink">Comparación de evaluaciones</h3>
                  <p className="mt-1 text-body-sm text-muted">Riesgo seleccionado: {compareRiskId}</p>
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
                <p role="status" className="mt-4 text-body-sm text-muted">
                  Consultando evaluaciones anteriores…
                </p>
              ) : compareError ? (
                <p role="alert" className="mt-4 text-body-sm text-ink">
                  {compareError}
                </p>
              ) : !comparison || comparison.length < 2 ? (
                <p className="mt-4 text-body-sm text-muted">
                  Este riesgo todavía no tiene dos evaluaciones para comparar. Registra otra evaluación para consultar
                  su evolución.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[latest, previous].map((item, index) =>
                      item ? (
                        <div key={item.evaluation_id} className="rounded-md border border-line bg-nav p-4">
                          <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
                            {index === 0 ? "Evaluación más reciente" : "Evaluación anterior"}
                          </p>

                          <p className="mt-2 text-body font-semibold text-ink">{item.risk_name}</p>

                          <p className="mt-1 text-xs text-muted">{formatDate(item.created_at)}</p>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">Prob.</p>
                              <p className="mt-1 font-semibold text-ink">{item.probability}/5</p>
                            </div>

                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">Impacto</p>
                              <p className="mt-1 font-semibold text-ink">{item.impact}/5</p>
                            </div>

                            <div className="rounded-md border border-line bg-surface p-2">
                              <p className="m-0 text-xs text-muted">Puntaje</p>
                              <p className="mt-1 font-semibold text-ink">{item.risk_score}/25</p>
                            </div>
                          </div>

                          <span
                            className={`mt-3 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getLevelStyle(item.risk_level)}`}
                          >
                            {item.risk_level}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>

                  <div className="mt-3 rounded-md border border-line bg-surface p-4">
                    <p className="m-0 text-body-sm font-medium text-ink">Cambio en el puntaje</p>

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
                      Un cambio en el puntaje no determina por sí solo si el riesgo está resuelto; debe interpretarse
                      junto con el contexto y los controles aplicados.
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
