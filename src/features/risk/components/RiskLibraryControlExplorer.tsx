
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  History,
  ShieldCheck,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { riskLibraryService } from "../services/riskLibraryService";
import { controlEvaluationService } from "../services/controlEvaluationService";

import type { RiskLibraryItem, AssociatedRisk } from "../services/riskLibraryService";
import type {
  ControlEvaluationHistory,
  RiskWithControlsDetail,
} from "../types/controlEvaluation.types";

type Props = {
  selectedRisk: RiskLibraryItem;
};

type RiskDetailState = {
  trackingId: string;
  detail: RiskWithControlsDetail | null;
  error: string | null;
};

type HistoryState = Record<number, ControlEvaluationHistory>;

function levelStyle(level?: string | null) {
  switch (level?.toLowerCase()) {
    case "menor":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "bajo":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "moderado":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "alto":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "crítico":
    case "critico":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-line bg-nav text-muted";
  }
}

function LevelBadge({ level }: { level?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${levelStyle(level)}`}
    >
      {level || "Sin información"}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-body-sm text-muted">{label}</p>
      <p className="mt-2 text-heading font-semibold text-ink">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted">{description}</p>
      )}
    </div>
  );
}

export function RiskLibraryControlExplorer({ selectedRisk }: Props) {
  const [associatedRisks, setAssociatedRisks] = useState<AssociatedRisk[]>([]);
  const [riskDetails, setRiskDetails] = useState<RiskDetailState[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedRisks, setExpandedRisks] = useState<string[]>([]);
  const [expandedControls, setExpandedControls] = useState<number[]>([]);

  const [histories, setHistories] = useState<HistoryState>({});
  const [historyLoading, setHistoryLoading] = useState<number[]>([]);
  const [historyErrors, setHistoryErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadExplorer() {
      setLoading(true);
      setError(null);
      setAssociatedRisks([]);
      setRiskDetails([]);
      setExpandedRisks([]);
      setExpandedControls([]);
      setHistories({});
      setHistoryErrors({});
      setHistoryLoading([]);

      try {
        const response = await riskLibraryService.getAssociatedRisks(
          selectedRisk.risk_library_id,
        );

        if (cancelled) return;

        setAssociatedRisks(response.risks);

        const details = await Promise.all(
          response.risks.map(async (risk) => {
            try {
              const detail = await controlEvaluationService.getRiskDetail(
                risk.tracking_id,
                controller.signal,
              );

              return {
                trackingId: risk.tracking_id,
                detail,
                error: null,
              } satisfies RiskDetailState;
            } catch (err) {
              return {
                trackingId: risk.tracking_id,
                detail: null,
                error:
                  err instanceof ApiError
                    ? err.message
                    : "No se pudo cargar el detalle de este riesgo.",
              } satisfies RiskDetailState;
            }
          }),
        );

        if (!cancelled) {
          setRiskDetails(details);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar la información de los riesgos asociados.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadExplorer();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedRisk.risk_library_id]);

  const allControls = useMemo(
    () => riskDetails.flatMap((item) => item.detail?.controls ?? []),
    [riskDetails],
  );

  const evaluatedControls = allControls.filter(
    (control) => control.latestEvaluation !== null,
  );

  const pendingControls = allControls.length - evaluatedControls.length;

  const residualRisks = riskDetails
    .filter((item) => item.detail !== null)
    .map((item) => ({
      trackingId: item.trackingId,
      name: item.detail!.risk.name,
      residualRisk: item.detail!.residualRisk,
    }));

  const vulnerabilityDistribution = useMemo(() => {
    const levels = ["Menor", "Bajo", "Moderado", "Alto", "Crítico"];

    return levels.map((level) => ({
      level,
      count: evaluatedControls.filter(
        (control) =>
          control.latestEvaluation?.vulnerability?.toLowerCase() ===
          level.toLowerCase(),
      ).length,
    }));
  }, [evaluatedControls]);

  const totalEvaluationsLoaded = Object.values(histories).reduce(
    (total, history) => total + history.count,
    0,
  );

  const monthlyTrend = useMemo(() => {
    const counts = new Map<string, number>();

    Object.values(histories).forEach((history) => {
      history.evaluations.forEach((evaluation) => {
        const date = new Date(evaluation.evaluatedAt);

        if (Number.isNaN(date.getTime())) return;

        const month = date.toLocaleDateString("es-MX", {
          month: "short",
          year: "numeric",
        });

        counts.set(month, (counts.get(month) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries());
  }, [histories]);

  function toggleRisk(trackingId: string) {
    setExpandedRisks((current) =>
      current.includes(trackingId)
        ? current.filter((id) => id !== trackingId)
        : [...current, trackingId],
    );
  }

  async function toggleControl(controlId: number) {
    setExpandedControls((current) => {
      if (current.includes(controlId)) {
        return current.filter((id) => id !== controlId);
      }

      return [...current, controlId];
    });

    if (histories[controlId] || historyLoading.includes(controlId)) {
      return;
    }

    setHistoryLoading((current) => [...current, controlId]);
    setHistoryErrors((current) => {
      const next = { ...current };
      delete next[controlId];
      return next;
    });

    try {
      const history =
        await controlEvaluationService.getControlHistory(controlId);

      setHistories((current) => ({
        ...current,
        [controlId]: history,
      }));
    } catch (err) {
      setHistoryErrors((current) => ({
        ...current,
        [controlId]:
          err instanceof ApiError
            ? err.message
            : "No se pudo cargar el historial del control.",
      }));
    } finally {
      setHistoryLoading((current) =>
        current.filter((id) => id !== controlId),
      );
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-accent" />
              <h2 className="text-body font-semibold text-ink">
                Análisis de controles y riesgo residual
              </h2>
            </div>

            <p className="mt-1 text-body-sm text-muted">
              {selectedRisk.risk_name}
            </p>

            <p className="mt-1 text-xs text-muted">
              {selectedRisk.risk_library_id}
              {" · "}
              {selectedRisk.audit_department || "Sin departamento"}
            </p>
          </div>

          <span className="rounded-full border border-line bg-nav px-3 py-1 text-xs text-muted">
            {loading ? "Actualizando información..." : "Datos del Risk Register"}
          </span>
        </div>
      </section>

      {loading ? (
        <div className="rounded-md border border-line bg-surface p-10 text-center text-body-sm text-muted">
          Consultando registros, controles y evaluaciones...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-line bg-surface p-4 text-body-sm text-ink"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Registros Risk Register"
              value={associatedRisks.length}
              description="RSK asociados a esta entrada"
            />
            <MetricCard
              label="Controles registrados"
              value={allControls.length}
              description="Controles de los RSK asociados"
            />
            <MetricCard
              label="Controles evaluados"
              value={evaluatedControls.length}
              description="Con una evaluación disponible"
            />
            <MetricCard
              label="Controles pendientes"
              value={pendingControls}
              description="Sin evaluaciones registradas"
            />
          </section>

          <section className="rounded-md border border-line bg-surface p-4">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList size={19} className="text-accent" />
              <div>
                <h2 className="text-body font-semibold text-ink">
                  Risk Register y controles
                </h2>
                <p className="text-xs text-muted">
                  Cada RSK mantiene su propio cálculo de riesgo residual.
                </p>
              </div>
            </div>

            {associatedRisks.length === 0 ? (
              <p className="rounded-md bg-nav p-5 text-center text-body-sm text-muted">
                No existen registros asociados disponibles para esta entrada.
              </p>
            ) : (
              <div className="space-y-3">
                {associatedRisks.map((risk) => {
                  const item = riskDetails.find(
                    (detail) => detail.trackingId === risk.tracking_id,
                  );

                  const detail = item?.detail;
                  const isExpanded = expandedRisks.includes(risk.tracking_id);

                  const controls = detail?.controls ?? [];
                  const evaluated = controls.filter(
                    (control) => control.latestEvaluation !== null,
                  ).length;

                  return (
                    <article
                      key={risk.risk_id}
                      className="overflow-hidden rounded-md border border-line"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRisk(risk.tracking_id)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 bg-nav p-4 text-left hover:bg-surface"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          {isExpanded ? (
                            <ChevronDown size={18} className="mt-0.5 shrink-0 text-muted" />
                          ) : (
                            <ChevronRight size={18} className="mt-0.5 shrink-0 text-muted" />
                          )}

                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
                              {risk.tracking_id}
                            </p>
                            <p className="mt-1 text-body-sm text-ink">
                              {risk.name}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {controls.length} controles · {evaluated} evaluados ·{" "}
                              {controls.length - evaluated} pendientes
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <LevelBadge level={detail?.risk.inherentLevel ?? risk.inherent_level} />
                          <LevelBadge level={detail?.residualRisk?.level ?? null} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-4 p-4">
                          {item?.error ? (
                            <div role="alert" className="rounded-md border border-line p-3 text-body-sm text-ink">
                              {item.error}
                            </div>
                          ) : !detail ? (
                            <p className="text-body-sm text-muted">
                              No se pudo recuperar el detalle de este registro.
                            </p>
                          ) : (
                            <>
                              <div className="grid gap-3 sm:grid-cols-3">
                                <MetricCard
                                  label="Riesgo inherente"
                                  value={detail.risk.inherentLevel || "Sin información"}
                                />
                                <MetricCard
                                  label="Riesgo residual"
                                  value={detail.residualRisk?.level ?? "Sin evaluaciones"}
                                  description={
                                    detail.residualRisk
                                      ? `Mediana de ${detail.residualRisk.evaluatedControls} controles evaluados`
                                      : "Se necesita al menos un control evaluado"
                                  }
                                />
                                <MetricCard
                                  label="Controles evaluados"
                                  value={`${evaluated} / ${controls.length}`}
                                  description="Los pendientes no participan en la mediana"
                                />
                              </div>

                              <div>
                                <h3 className="mb-3 text-control font-semibold text-ink">
                                  Controles asociados
                                </h3>

                                {controls.length === 0 ? (
                                  <p className="rounded-md bg-nav p-4 text-body-sm text-muted">
                                    Este riesgo no tiene controles registrados.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {controls.map((control) => {
                                      const evaluation = control.latestEvaluation;
                                      const isControlExpanded =
                                        expandedControls.includes(control.controlId);

                                      const history = histories[control.controlId];

                                      return (
                                        <div
                                          key={control.controlId}
                                          className="rounded-md border border-line"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => void toggleControl(control.controlId)}
                                            className="flex w-full flex-wrap items-center justify-between gap-3 p-3 text-left hover:bg-nav"
                                          >
                                            <div className="flex min-w-0 items-start gap-2">
                                              {isControlExpanded ? (
                                                <ChevronDown size={16} className="mt-0.5 shrink-0 text-muted" />
                                              ) : (
                                                <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" />
                                              )}
                                              <div className="min-w-0">
                                                <p className="text-body-sm font-medium text-ink">
                                                  {control.trackingId}
                                                </p>
                                                <p className="mt-1 text-body-sm text-muted">
                                                  {control.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted">
                                                  {control.domain || "Sin dominio"}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                              {evaluation ? (
                                                <>
                                                  <LevelBadge level={evaluation.vulnerability} />
                                                  <span className="text-xs text-muted">
                                                    {formatDate(evaluation.evaluatedAt)}
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="rounded-full border border-line bg-nav px-2.5 py-1 text-xs text-muted">
                                                  Pendiente de evaluación
                                                </span>
                                              )}
                                            </div>
                                          </button>

                                          {isControlExpanded && (
                                            <div className="border-t border-line bg-nav p-3">
                                              {evaluation && (
                                                <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                                  <MetricCard
                                                    label="Probabilidad"
                                                    value={evaluation.probability}
                                                  />
                                                  <MetricCard
                                                    label="Impacto"
                                                    value={evaluation.impact}
                                                  />
                                                  <MetricCard
                                                    label="Diseño"
                                                    value={evaluation.designRating}
                                                  />
                                                  <MetricCard
                                                    label="Efectividad"
                                                    value={evaluation.effectivenessRating}
                                                  />
                                                </div>
                                              )}

                                              {evaluation && (
                                                <div className="mb-4 rounded-md border border-line bg-surface p-3">
                                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-xs text-muted">
                                                      Nivel del control
                                                    </span>
                                                    <LevelBadge level={evaluation.controlLevel} />
                                                  </div>
                                                  {evaluation.comments && (
                                                    <p className="mt-3 text-body-sm text-ink">
                                                      {evaluation.comments}
                                                    </p>
                                                  )}
                                                </div>
                                              )}

                                              <div className="flex items-center gap-2">
                                                <History size={17} className="text-accent" />
                                                <h4 className="text-control font-semibold text-ink">
                                                  Historial de evaluaciones
                                                </h4>
                                              </div>

                                              {historyLoading.includes(control.controlId) ? (
                                                <p className="py-4 text-body-sm text-muted">
                                                  Cargando historial...
                                                </p>
                                              ) : historyErrors[control.controlId] ? (
                                                <p role="alert" className="py-3 text-body-sm text-ink">
                                                  {historyErrors[control.controlId]}
                                                </p>
                                              ) : history ? (
                                                history.evaluations.length === 0 ? (
                                                  <p className="py-3 text-body-sm text-muted">
                                                    Este control todavía no tiene evaluaciones.
                                                  </p>
                                                ) : (
                                                  <div className="mt-3 space-y-3">
                                                    {history.evaluations.map((entry) => (
                                                      <div
                                                        key={entry.evaluationId}
                                                        className="rounded-md border border-line bg-surface p-3"
                                                      >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                          <span className="text-xs font-semibold text-ink">
                                                            Evaluación #{entry.evaluationId}
                                                          </span>
                                                          <LevelBadge level={entry.vulnerability} />
                                                        </div>

                                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                          <p className="text-xs text-muted">
                                                            Evaluador:{" "}
                                                            <strong className="text-ink">
                                                              {entry.evaluatedByUserName || "No disponible"}
                                                            </strong>
                                                          </p>
                                                          <p className="text-xs text-muted">
                                                            Fecha:{" "}
                                                            <strong className="text-ink">
                                                              {formatDate(entry.evaluatedAt)}
                                                            </strong>
                                                          </p>
                                                          <p className="text-xs text-muted">
                                                            Diseño:{" "}
                                                            <strong className="text-ink">
                                                              {entry.designRating}
                                                            </strong>
                                                          </p>
                                                          <p className="text-xs text-muted">
                                                            Efectividad:{" "}
                                                            <strong className="text-ink">
                                                              {entry.effectivenessRating}
                                                            </strong>
                                                          </p>
                                                        </div>

                                                        {entry.comments && (
                                                          <p className="mt-3 border-t border-line pt-2 text-body-sm text-ink">
                                                            {entry.comments}
                                                          </p>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )
                                              ) : (
                                                <p className="py-3 text-xs text-muted">
                                                  Expande el historial para consultar las evaluaciones registradas.
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-body font-semibold text-ink">
                Analítica de riesgo residual y controles
              </h2>
              <p className="mt-1 text-body-sm text-muted">
                Indicadores basados en la última evaluación disponible de cada control.
              </p>
            </div>

            <div className="grid gap-4 desktop:grid-cols-2">
              <div className="rounded-md border border-line bg-surface p-4">
                <h3 className="text-control font-semibold text-ink">
                  Distribución de vulnerabilidades
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Una observación por control evaluado, utilizando su última evaluación.
                </p>

                <div className="mt-4 space-y-3">
                  {vulnerabilityDistribution.map((item) => {
                    const percentage =
                      evaluatedControls.length > 0
                        ? (item.count / evaluatedControls.length) * 100
                        : 0;

                    return (
                      <div key={item.level}>
                        <div className="mb-1 flex justify-between gap-2 text-body-sm">
                          <span className="text-ink">{item.level}</span>
                          <span className="text-muted">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-nav">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface p-4">
                <h3 className="text-control font-semibold text-ink">
                  Riesgo residual por registro
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Cada mediana se calcula de forma independiente por RSK.
                </p>

                <div className="mt-4 space-y-3">
                  {residualRisks.map((item) => (
                    <div
                      key={item.trackingId}
                      className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-ink">
                          {item.trackingId}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {item.name}
                        </p>
                      </div>
                      <LevelBadge level={item.residualRisk?.level ?? null} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-start gap-2">
                <History size={18} className="mt-0.5 text-accent" />
                <div>
                  <h3 className="text-control font-semibold text-ink">
                    Tendencia de evaluaciones
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Se construye con los historiales que has abierto en esta vista.
                    Para consultar más registros, expande el historial de los controles correspondientes.
                  </p>
                </div>
              </div>

              {monthlyTrend.length === 0 ? (
                <p className="mt-4 rounded-md bg-nav p-4 text-center text-body-sm text-muted">
                  Abre el historial de uno o más controles para consultar su evolución.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {monthlyTrend.map(([month, count]) => {
                    const max = Math.max(...monthlyTrend.map((item) => item[1]));

                    return (
                      <div key={month}>
                        <div className="mb-1 flex justify-between text-body-sm">
                          <span className="text-ink">{month}</span>
                          <span className="text-muted">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-nav">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="mt-3 text-xs text-muted">
                {totalEvaluationsLoaded} evaluaciones históricas cargadas en esta sesión.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
