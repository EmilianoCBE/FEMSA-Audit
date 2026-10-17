
import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page, PageHeader } from "@/shared/ui";
import { riskService } from "../services/riskService";
import { riskLibraryService } from "../services/riskLibraryService";
import { RiskHistorySection } from "./RiskHistorySection";
import type { RiskClassification } from "../types";
import type { RiskLibraryItem } from "../services/riskLibraryService";

const RISK_OPTIONS = [
  { value: 1, label: "1 - Muy baja" },
  { value: 2, label: "2 - Baja" },
  { value: 3, label: "3 - Media" },
  { value: 4, label: "4 - Alta" },
  { value: 5, label: "5 - Muy alta" },
];

const DEPARTMENTS = ["Beverage", "Retail & Spin"];

function getLevelDescription(level: string) {
  switch (level) {
    case "Bajo":
      return "El riesgo se encuentra dentro de un nivel bajo.";
    case "Medio":
      return "El riesgo requiere seguimiento y evaluación.";
    case "Alto":
      return "El riesgo requiere atención y acciones de control.";
    case "Crítico":
      return "El riesgo requiere atención prioritaria.";
    default:
      return "";
  }
}

function getLevelStyle(level: string) {
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

export function RiskClassificationPage() {
  const [probability, setProbability] = useState("3");
  const [impact, setImpact] = useState("3");

  const [selectedRisk, setSelectedRisk] =
    useState<RiskLibraryItem | null>(null);

  const [result, setResult] = useState<RiskClassification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Triggers a history/dashboard refresh after a successful save.
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [risks, setRisks] = useState<RiskLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  // Load the risk library.
  useEffect(() => {
    let cancelled = false;

    async function loadRiskLibrary() {
      setLibraryLoading(true);
      setLibraryError(null);

      try {
        const response = await riskLibraryService.getAll({
          search,
          department,
        });

        if (!cancelled) {
          setRisks(response.risks);
        }
      } catch (err) {
        if (!cancelled) {
          setRisks([]);
          setLibraryError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar la biblioteca de riesgos."
          );
        }
      } finally {
        if (!cancelled) {
          setLibraryLoading(false);
        }
      }
    }

    void loadRiskLibrary();

    return () => {
      cancelled = true;
    };
  }, [search, department]);

  // Calculate the risk whenever the selected risk or its values change.
  useEffect(() => {
    let cancelled = false;

    if (!selectedRisk) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    async function calculateRisk() {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await riskService.classify({
          probability: Number(probability),
          impact: Number(impact),
        });

        if (!cancelled) {
          setResult(response.result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "No se pudo clasificar el riesgo."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void calculateRisk();

    return () => {
      cancelled = true;
    };
  }, [selectedRisk?.risk_library_id, probability, impact]);

  function selectRisk(risk: RiskLibraryItem) {
    setSelectedRisk(risk);
    setResult(null);
    setError(null);
    setSaveMessage(null);
  }

  async function handleSaveEvaluation() {
    if (!selectedRisk || !result || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      await riskService.saveEvaluation({
        riskLibraryId: selectedRisk.risk_library_id,
        probability: Number(probability),
        impact: Number(impact),
      });

      setSaveMessage(
        "Evaluación guardada correctamente en la base de datos."
      );

      // Refresh the history and dashboard after saving.
      setHistoryRefreshKey((current) => current + 1);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la evaluación."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Risk Management"
        description="Evalúa y clasifica los riesgos registrados en el catálogo de FEMSA."
      />

      <ContentArea>
        <div className="space-y-5">
          {/* Summary */}
          <section
            aria-label="Resumen de la biblioteca"
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-body-sm text-muted">
                <BookOpen size={17} />
                Riesgos en biblioteca
              </div>

              <div className="mt-2 text-heading font-semibold text-ink">
                {libraryLoading ? "…" : risks.length}
              </div>

              <p className="mt-1 text-body-sm text-muted">
                Resultados de la búsqueda actual.
              </p>
            </div>

            <div className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-body-sm text-muted">
                <ShieldAlert size={17} />
                Riesgo seleccionado
              </div>

              <div
                className="mt-2 truncate text-body font-semibold text-ink"
                title={selectedRisk?.risk_name}
              >
                {selectedRisk?.risk_library_id ?? "Ninguno"}
              </div>

              <p className="mt-1 truncate text-body-sm text-muted">
                {selectedRisk?.risk_name ??
                  "Selecciona un riesgo para evaluarlo."}
              </p>
            </div>
          </section>

          {/* Risk library and evaluation */}
          <div className="grid items-start gap-5 desktop:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            {/* Risk library */}
            <section
              aria-labelledby="library-heading"
              className="min-w-0 rounded-md border border-line bg-surface p-4"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-md border border-line bg-nav p-2 text-accent">
                  <BookOpen size={20} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="library-heading"
                    className="m-0 text-body font-semibold text-ink"
                  >
                    Biblioteca de riesgos
                  </h2>

                  <p className="mt-1 text-body-sm text-muted">
                    Selecciona un riesgo para comenzar su evaluación.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="risk-search"
                    className="mb-1.5 block text-control font-medium text-ink"
                  >
                    Buscar riesgo
                  </label>

                  <div className="flex items-center gap-2 rounded-[5px] border border-line-2 bg-surface px-3 focus-within:border-accent">
                    <Search size={17} className="shrink-0 text-muted" />

                    <input
                      id="risk-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nombre o ID del riesgo..."
                      className="w-full min-w-0 border-0 bg-transparent py-2 text-body-sm text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="risk-department"
                    className="mb-1.5 flex items-center gap-2 text-control font-medium text-ink"
                  >
                    <SlidersHorizontal size={15} />
                    Departamento
                  </label>

                  <select
                    id="risk-department"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                  >
                    <option value="">Todos los departamentos</option>
                    {DEPARTMENTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-nav px-3 py-2.5">
                  <span className="text-control font-medium text-ink">
                    Resultados
                  </span>

                  <span className="text-xs text-muted">
                    {libraryLoading ? "Cargando…" : risks.length}
                  </span>
                </div>

                <div
                  className="max-h-[360px] overflow-y-auto overscroll-contain"
                  aria-label="Lista de riesgos disponibles"
                >
                  {libraryLoading ? (
                    <div className="px-4 py-8 text-center text-body-sm text-muted">
                      Cargando biblioteca de riesgos…
                    </div>
                  ) : libraryError ? (
                    <div
                      role="alert"
                      className="flex items-center gap-2 px-4 py-8 text-body-sm text-ink"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      {libraryError}
                    </div>
                  ) : risks.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BookOpen
                        size={24}
                        className="mx-auto text-muted"
                      />

                      <p className="mt-2 text-body-sm font-medium text-ink">
                        No hay riesgos para mostrar
                      </p>

                      <p className="mt-1 text-body-sm text-muted">
                        Intenta con otra búsqueda o departamento.
                      </p>
                    </div>
                  ) : (
                    risks.map((risk) => {
                      const isSelected =
                        selectedRisk?.risk_library_id ===
                        risk.risk_library_id;

                      return (
                        <button
                          key={risk.risk_library_id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => selectRisk(risk)}
                          className={`flex w-full items-start gap-3 border-b border-line p-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                            isSelected
                              ? "bg-nav ring-1 ring-inset ring-accent"
                              : "bg-surface hover:bg-nav"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-accent bg-accent text-white"
                                : "border-line-2 text-transparent"
                            }`}
                          >
                            {isSelected && <Check size={13} />}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-body-sm font-medium text-ink">
                              {risk.risk_name}
                            </span>

                            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                              <span>{risk.risk_library_id}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {risk.audit_department || "Sin departamento"}
                              </span>
                            </span>
                          </span>

                          {isSelected && (
                            <span className="shrink-0 text-xs font-medium text-accent">
                              Seleccionado
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-muted">
                {risks.length}{" "}
                {risks.length === 1
                  ? "riesgo encontrado"
                  : "riesgos encontrados"}
                . Desplázate dentro de la lista para ver más.
              </p>
            </section>

            {/* Risk evaluation */}
            <section
              aria-labelledby="evaluation-heading"
              className="min-w-0 rounded-md border border-line bg-surface p-4"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-md border border-line bg-nav p-2 text-accent">
                  <ShieldAlert size={20} />
                </div>

                <div>
                  <h2
                    id="evaluation-heading"
                    className="m-0 text-body font-semibold text-ink"
                  >
                    Evaluación del riesgo
                  </h2>

                  <p className="mt-1 text-body-sm text-muted">
                    Configura la probabilidad y el impacto del riesgo elegido.
                  </p>
                </div>
              </div>

              {!selectedRisk ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-line-2 bg-nav p-6 text-center">
                  <div className="rounded-full border border-line bg-surface p-3 text-muted">
                    <ShieldAlert size={26} />
                  </div>

                  <h3 className="mt-3 text-body font-semibold text-ink">
                    Selecciona un riesgo
                  </h3>

                  <p className="mt-1 max-w-xs text-body-sm text-muted">
                    Elige un registro de la biblioteca para identificar qué
                    riesgo estás evaluando.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-md border border-line bg-nav p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 text-xs font-medium uppercase tracking-wide text-muted">
                          Riesgo seleccionado
                        </p>

                        <h3 className="mt-1 break-words text-body font-semibold text-ink">
                          {selectedRisk.risk_name}
                        </h3>

                        <p className="mt-1 text-body-sm text-muted">
                          {selectedRisk.risk_library_id}
                          {" · "}
                          {selectedRisk.audit_department || "Sin departamento"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted">
                        En evaluación
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="probability"
                        className="mb-1.5 block text-control font-medium text-ink"
                      >
                        Probabilidad
                      </label>

                      <select
                        id="probability"
                        value={probability}
                        onChange={(event) =>
                          setProbability(event.target.value)
                        }
                        className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                      >
                        {RISK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="impact"
                        className="mb-1.5 block text-control font-medium text-ink"
                      >
                        Impacto
                      </label>

                      <select
                        id="impact"
                        value={impact}
                        onChange={(event) =>
                          setImpact(event.target.value)
                        }
                        className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                      >
                        {RISK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading && (
                    <div
                      role="status"
                      className="mt-4 rounded-md border border-line bg-nav px-3 py-3 text-body-sm text-muted"
                    >
                      Calculando el nivel de riesgo…
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2 rounded-md border border-line-2 bg-surface px-3 py-3 text-body-sm text-ink"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  {result && !loading && (
                    <div className="mt-4">
                      <h3 className="mb-3 text-body font-semibold text-ink">
                        Resultado de la evaluación
                      </h3>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-md border border-line bg-nav p-3">
                          <p className="m-0 text-xs text-muted">
                            Probabilidad
                          </p>
                          <p className="mt-1 text-heading font-semibold text-ink">
                            {result.probability}/5
                          </p>
                        </div>

                        <div className="rounded-md border border-line bg-nav p-3">
                          <p className="m-0 text-xs text-muted">Impacto</p>
                          <p className="mt-1 text-heading font-semibold text-ink">
                            {result.impact}/5
                          </p>
                        </div>

                        <div className="rounded-md border border-line bg-nav p-3">
                          <p className="m-0 text-xs text-muted">Puntaje</p>
                          <p className="mt-1 text-heading font-semibold text-ink">
                            {result.score}/25
                          </p>
                        </div>
                      </div>

                      <div
                        className={`mt-3 rounded-md border p-4 ${getLevelStyle(result.level)}`}
                      >
                        <p className="m-0 text-control font-medium">
                          Nivel de riesgo
                        </p>

                        <p className="mt-1 text-heading font-semibold">
                          {result.level}
                        </p>

                        <p className="mt-1 text-body-sm">
                          {getLevelDescription(result.level)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveEvaluation}
                        disabled={saving || loading || !result}
                        className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 text-body-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving
                          ? "Guardando evaluación..."
                          : "Guardar evaluación"}
                      </button>

                      {saveMessage && (
                        <div
                          role="status"
                          className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-body-sm text-emerald-800"
                        >
                          {saveMessage}
                        </div>
                      )}

                      <p className="mt-3 text-xs text-muted">
                        Resultado calculado para {selectedRisk.risk_library_id}.
                        {saveMessage
                          ? " La evaluación se guardó en la base de datos."
                          : " Guarda la evaluación para registrar el resultado en el historial."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* History, dashboard, filters and comparison */}
          <RiskHistorySection refreshKey={historyRefreshKey} />
        </div>
      </ContentArea>
    </Page>
  );
}



