
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page, PageHeader } from "@/shared/ui";
import { riskService } from "../services/riskService";
import { riskLibraryService } from "../services/riskLibraryService";
import type { RiskClassification } from "../types";
import type { RiskLibraryItem } from "../services/riskLibraryService";

const RISK_OPTIONS = [
  { value: 1, label: "1 - Muy baja" },
  { value: 2, label: "2 - Baja" },
  { value: 3, label: "3 - Media" },
  { value: 4, label: "4 - Alta" },
  { value: 5, label: "5 - Muy alta" },
];

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
  const [result, setResult] = useState<RiskClassification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [risks, setRisks] = useState<RiskLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    let cancelled = false;

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
              : "No se pudo clasificar el riesgo.",
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
  }, [probability, impact]);

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
              : "No se pudo cargar la biblioteca de riesgos.",
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

  const departments = useMemo(
    () =>
      [...new Set(
        risks
          .map((risk) => risk.audit_department)
          .filter((value): value is string => Boolean(value)),
      )].sort((a, b) => a.localeCompare(b)),
    [risks],
  );

  return (
    <Page>
      <PageHeader
        title="Gestión y clasificación de riesgos"
        description="Evalúa la probabilidad y el impacto, y consulta el catálogo de riesgos de FEMSA."
      />

      <ContentArea>
        <div className="space-y-5">

          {/* EVALUACIÓN: ahora aparece primero */}
          <section aria-labelledby="evaluation-heading">
            <div className="mb-3 flex items-start gap-3">
              <div className="rounded-md border border-line bg-nav p-2 text-accent">
                <ShieldAlert size={21} />
              </div>
              <div>
                <h2
                  id="evaluation-heading"
                  className="m-0 text-body font-semibold text-ink"
                >
                  Evaluación del riesgo
                </h2>
                <p className="mt-1 text-body-sm text-muted">
                  Selecciona la probabilidad y el impacto para calcular el nivel automáticamente.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-4">
              <div className="grid gap-4 desktop:grid-cols-2">
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
                    onChange={(event) => setProbability(event.target.value)}
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
                    onChange={(event) => setImpact(event.target.value)}
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
            </div>

            {loading && (
              <div
                role="status"
                className="mt-3 rounded-md border border-line bg-surface px-4 py-3 text-body-sm text-muted"
              >
                Calculando el nivel de riesgo…
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-md border border-line-2 bg-surface px-4 py-3 text-body-sm text-ink"
              >
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {result && (
              <div
                role="status"
                className="mt-3 rounded-md border border-line bg-surface p-4"
              >
                <div className="mb-3">
                  <h3 className="m-0 text-body font-semibold text-ink">
                    Resultado de la evaluación
                  </h3>
                  <p className="mt-1 text-body-sm text-muted">
                    El puntaje se calcula a partir de la probabilidad y el impacto seleccionados.
                  </p>
                </div>

                <div className="grid gap-3 desktop:grid-cols-3">
                  <div className="rounded-md border border-line bg-nav p-3">
                    <div className="text-control text-muted">Probabilidad</div>
                    <div className="mt-1 text-heading font-semibold text-ink">
                      {result.probability} / 5
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-nav p-3">
                    <div className="text-control text-muted">Impacto</div>
                    <div className="mt-1 text-heading font-semibold text-ink">
                      {result.impact} / 5
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-nav p-3">
                    <div className="text-control text-muted">Puntaje</div>
                    <div className="mt-1 text-heading font-semibold text-ink">
                      {result.score} / 25
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-3 rounded-md border p-4 ${getLevelStyle(result.level)}`}
                >
                  <div className="text-control font-medium">
                    Nivel de riesgo
                  </div>
                  <div className="mt-1 text-heading font-semibold">
                    {result.level}
                  </div>
                  <p className="mt-1 text-body-sm">
                    {getLevelDescription(result.level)}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* BIBLIOTECA: panel compacto con scroll independiente */}
          <section aria-labelledby="library-heading">
            <div className="mb-3 flex items-start gap-3">
              <div className="rounded-md border border-line bg-nav p-2 text-accent">
                <BookOpen size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="library-heading"
                    className="m-0 text-body font-semibold text-ink"
                  >
                    Biblioteca de riesgos
                  </h2>
                  <span className="rounded-full border border-line bg-nav px-2 py-0.5 text-xs font-medium text-muted">
                    {libraryLoading ? "Cargando…" : `${risks.length} resultados`}
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-muted">
                  Busca un riesgo por nombre o ID, o filtra por departamento.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-3">
              {/* Filtros siempre visibles */}
              <div className="grid gap-3 desktop:grid-cols-[minmax(0,1fr)_minmax(220px,0.4fr)]">
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
                    {departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Solo esta área tiene altura limitada y scroll */}
              <div className="mt-3 overflow-hidden rounded-md border border-line">
                <div className="grid grid-cols-[minmax(100px,0.65fr)_minmax(0,2fr)_minmax(110px,0.8fr)] gap-3 border-b border-line bg-nav px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>ID</span>
                  <span>Nombre del riesgo</span>
                  <span>Departamento</span>
                </div>

                <div
                  className="max-h-[280px] overflow-y-auto overscroll-contain"
                  aria-label="Lista desplazable de riesgos"
                >
                  {libraryLoading ? (
                    <div className="px-4 py-8 text-center text-body-sm text-muted">
                      Cargando biblioteca de riesgos…
                    </div>
                  ) : libraryError ? (
                    <div
                      role="alert"
                      className="flex items-center justify-center gap-2 px-4 py-8 text-body-sm text-ink"
                    >
                      <AlertCircle size={18} />
                      {libraryError}
                    </div>
                  ) : risks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <BookOpen size={24} className="text-muted" />
                      <p className="m-0 text-body-sm font-medium text-ink">
                        No hay riesgos para mostrar
                      </p>
                      <p className="m-0 text-body-sm text-muted">
                        Prueba con otra búsqueda o selecciona otro departamento.
                      </p>
                    </div>
                  ) : (
                    risks.map((risk) => (
                      <div
                        key={risk.risk_library_id}
                        className="grid grid-cols-[minmax(100px,0.65fr)_minmax(0,2fr)_minmax(110px,0.8fr)] items-center gap-3 border-b border-line px-3 py-3 text-body-sm last:border-b-0 hover:bg-nav"
                      >
                        <span className="break-words font-medium text-ink">
                          {risk.risk_library_id}
                        </span>
                        <span className="min-w-0 break-words text-ink">
                          {risk.risk_name}
                        </span>
                        <span className="break-words text-muted">
                          {risk.audit_department || "Sin departamento"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {libraryLoading
                    ? "Actualizando resultados…"
                    : `${risks.length} ${risks.length === 1 ? "riesgo encontrado" : "riesgos encontrados"}`}
                </span>
                <span>Desplázate dentro de la lista para ver más</span>
              </div>
            </div>
          </section>
        </div>
      </ContentArea>
    </Page>
  );
}


