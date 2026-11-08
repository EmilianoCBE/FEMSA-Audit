
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
  History,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Layers3,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page, PageHeader } from "@/shared/ui";
import { controlEvaluationService } from "../services/controlEvaluationService";

import type {
  ControlEvaluationHistory,
  ControlRating,
  Impact,
  Probability,
  RiskWithControlsDetail,
  RiskWithControlsSummary,
} from "../types/controlEvaluation.types";

const PROBABILITIES: Probability[] = [
  "Inminente",
  "Altamente probable",
  "Probable",
  "No probable",
  "Remota",
];

const IMPACTS: Impact[] = [
  "Menor",
  "Bajo",
  "Moderado",
  "Alto",
  "Crítico",
];

const CONTROL_RATINGS: ControlRating[] = [
  "Inicial",
  "Funcional",
  "Definido",
  "Gestionado",
  "Optimizado",
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function getLevelStyle(level: string) {
  switch (level) {
    case "Menor":
    case "Bajo":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Moderado":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Alto":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "Crítico":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-line bg-nav text-ink";
  }
}

function getInherentLevelOrder(level: string) {
  const normalized = level.toLocaleLowerCase("es");
  const order = [
    "menor",
    "bajo",
    "moderado",
    "medio",
    "alto",
    "crítico",
    "critico",
  ];
  const index = order.indexOf(normalized);
  return index === -1 ? order.length : index;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Los valores organizacionales pueden contener varios elementos
 * separados por " | " porque un control puede estar relacionado
 * con más de un catálogo.
 */
function splitCatalogValues(value: string | null | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-body-sm font-medium ${getLevelStyle(level)}`}
    >
      {level}
    </span>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-control font-medium text-ink"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CatalogInfo({
  control,
}: {
  control: {
    catalogCodes: string | null;
    auditDepartments: string | null;
    auditDomains: string | null;
    businessUnits: string | null;
    divisions: string | null;
    subdivisions: string | null;
    areas: string | null;
    countries: string | null;
  };
}) {
  const items = [
    {
      label: "Departamento de auditoría",
      value: control.auditDepartments,
    },
    {
      label: "Dominio de auditoría",
      value: control.auditDomains,
    },
    {
      label: "Unidad de negocio",
      value: control.businessUnits,
    },
    {
      label: "División",
      value: control.divisions,
    },
    {
      label: "Subdivisión",
      value: control.subdivisions,
    },
    {
      label: "Área",
      value: control.areas,
    },
    {
      label: "País",
      value: control.countries,
    },
    {
      label: "Código de catálogo",
      value: control.catalogCodes,
    },
  ];

  const hasInformation = items.some(
    (item) => splitCatalogValues(item.value).length > 0,
  );

  if (!hasInformation) {
    return (
      <p className="text-caption text-muted">
        No hay información organizacional disponible para este control.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const values = splitCatalogValues(item.value);

        if (values.length === 0) return null;

        return (
          <div key={item.label} className="min-w-0">
            <p className="text-caption text-muted">{item.label}</p>
            <p className="mt-0.5 break-words text-body-sm font-medium text-ink">
              {values.join(", ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function RiskAssessmentMatrix({
  probability,
  impact,
  onChange,
}: {
  probability: Probability;
  impact: Impact;
  onChange: (probability: Probability, impact: Impact) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-control font-medium text-ink">
          Probabilidad e impacto
        </p>
        <p className="mt-1 text-caption text-muted">
          Selecciona la intersección entre la probabilidad y el impacto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          <div className="grid grid-cols-[150px_repeat(5,minmax(0,1fr))] gap-1.5">
            <div className="flex items-end justify-center pb-2">
              <span className="text-caption font-medium text-muted">
                Probabilidad ↓
              </span>
            </div>

            {IMPACTS.map((value) => (
              <div
                key={value}
                className="flex min-h-[42px] items-center justify-center rounded-md bg-nav px-1 text-center text-caption font-semibold text-ink"
              >
                {value}
              </div>
            ))}

            {PROBABILITIES.map((probabilityValue) => (
              <div
                key={probabilityValue}
                className="contents"
              >
                <div className="flex items-center rounded-md bg-nav px-2 text-body-sm font-medium text-ink">
                  {probabilityValue}
                </div>

                {IMPACTS.map((impactValue) => {
                  const isSelected =
                    probability === probabilityValue &&
                    impact === impactValue;

                  return (
                    <button
                      key={`${probabilityValue}-${impactValue}`}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Probabilidad ${probabilityValue}, impacto ${impactValue}`}
                      onClick={() =>
                        onChange(probabilityValue, impactValue)
                      }
                      className={`flex min-h-[58px] items-center justify-center rounded-md border-2 transition ${
                        isSelected
                          ? "border-accent bg-accent text-white shadow-sm"
                          : "border-line bg-surface text-muted hover:border-accent hover:bg-nav hover:text-accent"
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <span className="text-lg">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line bg-nav p-3">
        <p className="text-caption text-muted">Selección actual</p>
        <p className="mt-1 text-body-sm font-semibold text-ink">
          Probabilidad: {probability} · Impacto: {impact}
        </p>
      </div>
    </div>
  );
}

/**
 * Selector visual para las calificaciones del control.
 */
function RatingOptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: ControlRating;
  options: readonly ControlRating[];
  onChange: (value: ControlRating) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-control font-medium text-ink">
        {label}
      </legend>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option)}
              className={`min-h-[46px] rounded-md border px-3 py-2 text-body-sm font-medium transition ${
                isSelected
                  ? "border-accent bg-nav text-accent ring-1 ring-accent"
                  : "border-line-2 bg-surface text-ink hover:border-accent hover:bg-nav"
              }`}
            >
              {option}
              {isSelected && (
                <CheckCircle2
                  size={15}
                  className="ml-1 inline-block"
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ControlEvaluationPage() {
  const [risks, setRisks] = useState<RiskWithControlsSummary[]>([]);
  const [risksLoading, setRisksLoading] = useState(true);
  const [risksError, setRisksError] = useState<string | null>(null);

  // Filtros, ordenamiento y paginación del catálogo de riesgos.
  const [riskSearch, setRiskSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [inherentLevelFilter, setInherentLevelFilter] = useState("Todos");
  const [riskSort, setRiskSort] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [riskDetail, setRiskDetail] =
    useState<RiskWithControlsDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [selectedControlId, setSelectedControlId] = useState<number | null>(
    null,
  );

  // Filtros, ordenamiento y paginación de controles.
  const [controlSearch, setControlSearch] = useState("");
  const [controlStatusFilter, setControlStatusFilter] = useState("Todos");
  const [controlSort, setControlSort] = useState("id-asc");
  const [controlsCurrentPage, setControlsCurrentPage] = useState(1);
  const [controlsPageSize, setControlsPageSize] = useState(10);

  const [history, setHistory] = useState<ControlEvaluationHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [probability, setProbability] =
    useState<Probability>("Probable");
  const [impact, setImpact] = useState<Impact>("Moderado");
  const [designRating, setDesignRating] =
    useState<ControlRating>("Definido");
  const [effectivenessRating, setEffectivenessRating] =
    useState<ControlRating>("Definido");
  const [comments, setComments] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedControl = riskDetail?.controls.find(
    (control) => control.controlId === selectedControlId,
  );

  // Opciones de filtros organizacionales.

  const categories = Array.from(
    new Set(risks.map((risk) => risk.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const inherentLevels = Array.from(
    new Set(risks.map((risk) => risk.inherentLevel).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const filteredRisks = risks
    .filter((risk) => {
      const query = riskSearch.trim().toLocaleLowerCase("es");

      const matchesSearch =
        !query ||
        risk.name.toLocaleLowerCase("es").includes(query) ||
        risk.trackingId.toLocaleLowerCase("es").includes(query);

      const matchesCategory =
        categoryFilter === "Todas" || risk.category === categoryFilter;

      const matchesLevel =
        inherentLevelFilter === "Todos" ||
        risk.inherentLevel === inherentLevelFilter;

      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      switch (riskSort) {
        case "name-desc":
          return b.name.localeCompare(a.name, "es", {
            sensitivity: "base",
          });
        case "id-asc":
          return a.trackingId.localeCompare(b.trackingId, "es", {
            numeric: true,
            sensitivity: "base",
          });
        case "id-desc":
          return b.trackingId.localeCompare(a.trackingId, "es", {
            numeric: true,
            sensitivity: "base",
          });
        case "level-asc":
          return (
            getInherentLevelOrder(a.inherentLevel) -
            getInherentLevelOrder(b.inherentLevel)
          );
        case "level-desc":
          return (
            getInherentLevelOrder(b.inherentLevel) -
            getInherentLevelOrder(a.inherentLevel)
          );
        default:
          return a.name.localeCompare(b.name, "es", {
            sensitivity: "base",
          });
      }
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRisks.length / pageSize),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const paginatedRisks = filteredRisks.slice(
    pageStart,
    pageStart + pageSize,
  );

  // Filtrar y ordenar los controles del riesgo seleccionado.
  const filteredControls = useMemo(() => {
    if (!riskDetail) return [];

    const query = controlSearch.trim().toLocaleLowerCase("es");

    return riskDetail.controls
        .filter((control) => {
        const searchableText = [
            control.trackingId,
            control.name,
            control.domain ?? "",
        ]
            .join(" ")
            .toLocaleLowerCase("es");

        const matchesSearch =
            !query || searchableText.includes(query);

        const isEvaluated = control.latestEvaluation !== null;

        const matchesStatus =
            controlStatusFilter === "Todos" ||
            (controlStatusFilter === "Evaluados" && isEvaluated) ||
            (controlStatusFilter === "Pendientes" && !isEvaluated);

        return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
        switch (controlSort) {
            case "id-desc":
            return b.trackingId.localeCompare(a.trackingId, "es", {
                numeric: true,
                sensitivity: "base",
            });
            case "domain-asc":
            return (a.domain ?? "").localeCompare(b.domain ?? "", "es", {
                sensitivity: "base",
            });
            case "pending-first":
            return Number(a.latestEvaluation !== null) -
                Number(b.latestEvaluation !== null);
            case "evaluated-first":
            return Number(b.latestEvaluation !== null) -
                Number(a.latestEvaluation !== null);
            default:
            return a.trackingId.localeCompare(b.trackingId, "es", {
                numeric: true,
                sensitivity: "base",
            });
        }
        });
    }, [
    riskDetail,
    controlSearch,
    controlStatusFilter,
    controlSort,
    ]);

  const controlsTotalPages = Math.max(
    1,
    Math.ceil(filteredControls.length / controlsPageSize),
  );

  const safeControlsCurrentPage = Math.min(
    controlsCurrentPage,
    controlsTotalPages,
  );

  const controlsPageStart =
    (safeControlsCurrentPage - 1) * controlsPageSize;

  const paginatedControls = filteredControls.slice(
    controlsPageStart,
    controlsPageStart + controlsPageSize,
  );

  function resetRiskFilters() {
    setRiskSearch("");
    setCategoryFilter("Todas");
    setInherentLevelFilter("Todos");
    setRiskSort("name-asc");
    setPageSize(10);
    setCurrentPage(1);
  }

  function resetControlFilters() {
    setControlSearch("");
    setControlStatusFilter("Todos");
    setControlSort("id-asc");
    setControlsPageSize(10);
    setControlsCurrentPage(1);
  }

  // Cargar el catálogo de riesgos.
  useEffect(() => {
    let cancelled = false;

    async function loadRisks() {
      setRisksLoading(true);
      setRisksError(null);

      try {
        const response = await controlEvaluationService.getRisks();

        if (!cancelled) {
          setRisks(response.risks);
        }
      } catch (error) {
        if (!cancelled) {
          setRisks([]);
          setRisksError(
            getErrorMessage(
              error,
              "No se pudo cargar el catálogo de riesgos.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setRisksLoading(false);
        }
      }
    }

    void loadRisks();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cargar el detalle y las últimas evaluaciones de cada control.
  useEffect(() => {
    if (!selectedRiskId) {
      setRiskDetail(null);
      setSelectedControlId(null);
      setDetailError(null);
      return;
    }

    const riskId = selectedRiskId;
    let cancelled = false;

    async function loadRiskDetail() {
      setDetailLoading(true);
      setDetailError(null);
      setRiskDetail(null);
      setSelectedControlId(null);
      setHistory(null);
      resetControlFilters();

      try {
        const response =
          await controlEvaluationService.getRiskDetail(riskId);

        if (!cancelled) {
          setRiskDetail(response);
          setSelectedControlId(
            response.controls[0]?.controlId ?? null,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(
            getErrorMessage(
              error,
              "No se pudo cargar el detalle del riesgo.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadRiskDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedRiskId]);

  // Reiniciar la página de controles cuando cambian los filtros.
  useEffect(() => {
    setControlsCurrentPage(1);
  }, [
    controlSearch,
    controlStatusFilter,
    controlSort,
    controlsPageSize,
  ]);

  // Consultar el historial completo del control seleccionado.
  useEffect(() => {
    if (selectedControlId === null) {
      setHistory(null);
      return;
    }

    const controlId = selectedControlId;
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response =
          await controlEvaluationService.getControlHistory(controlId);

        if (!cancelled) {
          setHistory(response);
        }
      } catch (error) {
        if (!cancelled) {
          setHistory(null);
          setHistoryError(
            getErrorMessage(
              error,
              "No se pudo cargar el historial del control.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedControlId]);

  function selectRisk(trackingId: string) {
    setSelectedRiskId(trackingId);
    setSaveMessage(null);
    setSaveError(null);
  }

  function returnToRiskList() {
    setSelectedRiskId(null);
    setRiskDetail(null);
    setSelectedControlId(null);
    setHistory(null);
    setSaveMessage(null);
    setSaveError(null);
    resetControlFilters();
  }

  async function handleSaveEvaluation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (selectedControlId === null || saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await controlEvaluationService.createEvaluation({
        controlId: selectedControlId,
        probability,
        impact,
        designRating,
        effectivenessRating,
        comments: comments.trim() || undefined,
      });

      setSaveMessage(response.message);
      setComments("");

      // Actualizar el detalle para reflejar la última evaluación
      // y recalcular el riesgo residual desde el backend.
      if (selectedRiskId) {
        const updatedDetail =
          await controlEvaluationService.getRiskDetail(selectedRiskId);
        setRiskDetail(updatedDetail);
      }

      // Actualizar el historial sin eliminar las evaluaciones anteriores.
      const updatedHistory =
        await controlEvaluationService.getControlHistory(
          selectedControlId,
        );
      setHistory(updatedHistory);
    } catch (error) {
      setSaveError(
        getErrorMessage(
          error,
          "No se pudo guardar la evaluación del control.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const evaluatedControls =
    riskDetail?.controls.filter(
      (control) => control.latestEvaluation !== null,
    ).length ?? 0;

  const totalControls = riskDetail?.controls.length ?? 0;

  return (
    <Page>
      <PageHeader
        title="Evaluación por controles"
        description="Evalúa los controles asociados a cada riesgo y consulta su vulnerabilidad y riesgo residual."
      />

      <ContentArea>
        <div className="space-y-5">
          {!selectedRiskId ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-line bg-surface p-4">
                  <div className="flex items-center gap-2 text-body-sm text-muted">
                    <ClipboardList size={17} />
                    Riesgos registrados
                  </div>
                  <div className="mt-2 text-heading font-semibold text-ink">
                    {risksLoading ? "…" : risks.length}
                  </div>
                  <p className="mt-1 text-body-sm text-muted">
                    Riesgos disponibles para evaluar sus controles.
                  </p>
                </div>

                <div className="rounded-md border border-line bg-surface p-4">
                  <div className="flex items-center gap-2 text-body-sm text-muted">
                    <ShieldCheck size={17} />
                    Controles registrados
                  </div>
                  <div className="mt-2 text-heading font-semibold text-ink">
                    {risksLoading
                      ? "…"
                      : risks.reduce(
                          (total, risk) => total + risk.controls.length,
                          0,
                        )}
                  </div>
                  <p className="mt-1 text-body-sm text-muted">
                    Controles relacionados con los riesgos del catálogo.
                  </p>
                </div>
              </section>

              <section className="rounded-md border border-line bg-surface p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-md border border-line bg-nav p-2 text-accent">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="m-0 text-body font-semibold text-ink">
                      Catálogo de riesgos
                    </h2>
                    <p className="mt-1 text-body-sm text-muted">
                      Selecciona un riesgo para consultar y evaluar sus
                      controles asociados.
                    </p>
                  </div>
                </div>

                {risksLoading ? (
                  <p className="text-body-sm text-muted">
                    Cargando riesgos…
                  </p>
                ) : risksError ? (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    {risksError}
                  </div>
                ) : risks.length === 0 ? (
                  <p className="text-body-sm text-muted">
                    No hay riesgos registrados.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="xl:col-span-2">
                        <label
                          htmlFor="risk-search"
                          className="mb-1.5 block text-control font-medium text-ink"
                        >
                          Buscar riesgo
                        </label>
                        <div className="relative">
                          <Search
                            size={17}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            id="risk-search"
                            type="search"
                            value={riskSearch}
                            onChange={(event) => {
                              setRiskSearch(event.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Buscar por nombre o ID…"
                            className="w-full rounded-md border border-line-2 bg-surface py-2 pl-9 pr-3 text-body-sm text-ink outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="risk-category-filter"
                          className="mb-1.5 block text-control font-medium text-ink"
                        >
                          Categoría
                        </label>
                        <select
                          id="risk-category-filter"
                          value={categoryFilter}
                          onChange={(event) => {
                            setCategoryFilter(event.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                        >
                          <option value="Todas">Todas las categorías</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="risk-level-filter"
                          className="mb-1.5 block text-control font-medium text-ink"
                        >
                          Riesgo inherente
                        </label>
                        <select
                          id="risk-level-filter"
                          value={inherentLevelFilter}
                          onChange={(event) => {
                            setInherentLevelFilter(event.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                        >
                          <option value="Todos">Todos los niveles</option>
                          {inherentLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="risk-sort"
                            className="mb-1.5 block text-control font-medium text-ink"
                          >
                            Ordenar por
                          </label>
                          <select
                            id="risk-sort"
                            value={riskSort}
                            onChange={(event) => {
                              setRiskSort(event.target.value);
                              setCurrentPage(1);
                            }}
                            className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                          >
                            <option value="name-asc">Nombre (A-Z)</option>
                            <option value="name-desc">Nombre (Z-A)</option>
                            <option value="id-asc">ID (ascendente)</option>
                            <option value="id-desc">ID (descendente)</option>
                            <option value="level-asc">Nivel inherente (A-Z)</option>
                            <option value="level-desc">Nivel inherente (Z-A)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="risk-page-size"
                            className="mb-1.5 block text-control font-medium text-ink"
                          >
                            Riesgos por página
                          </label>
                          <select
                            id="risk-page-size"
                            value={pageSize}
                            onChange={(event) => {
                              setPageSize(Number(event.target.value));
                              setCurrentPage(1);
                            }}
                            className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                          >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={resetRiskFilters}
                        disabled={
                          !riskSearch &&
                          categoryFilter === "Todas" &&
                          inherentLevelFilter === "Todos" &&
                          riskSort === "name-asc" &&
                          pageSize === 10
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X size={15} />
                        Limpiar filtros
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-muted">
                      <p>
                        {filteredRisks.length === 0
                          ? "No hay resultados para los filtros seleccionados."
                          : `Mostrando ${pageStart + 1}–${Math.min(
                              pageStart + pageSize,
                              filteredRisks.length,
                            )} de ${filteredRisks.length} riesgos`}
                      </p>
                      <p>{risks.length} riesgos en total</p>
                    </div>

                    {filteredRisks.length === 0 ? (
                      <div className="rounded-md border border-dashed border-line-2 p-8 text-center">
                        <Search size={24} className="mx-auto text-muted" />
                        <p className="mt-2 text-body-sm font-medium text-ink">
                          No se encontraron riesgos
                        </p>
                        <p className="mt-1 text-body-sm text-muted">
                          Prueba con otro nombre, ID o combinación de filtros.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px] text-left text-body-sm">
                            <thead>
                              <tr className="border-b border-line text-muted">
                                <th className="px-3 py-3 font-medium">ID</th>
                                <th className="px-3 py-3 font-medium">Riesgo</th>
                                <th className="px-3 py-3 font-medium">Categoría</th>
                                <th className="px-3 py-3 font-medium">
                                  Riesgo inherente
                                </th>
                                <th className="px-3 py-3 text-center font-medium">
                                  Controles
                                </th>
                                <th className="px-3 py-3 text-right font-medium">
                                  Acción
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedRisks.map((risk) => (
                                <tr
                                  key={risk.riskId}
                                  className="border-b border-line last:border-0"
                                >
                                  <td className="px-3 py-3 font-medium text-ink">
                                    {risk.trackingId}
                                  </td>
                                  <td className="max-w-[280px] px-3 py-3 text-ink">
                                    {risk.name}
                                  </td>
                                  <td className="px-3 py-3 text-muted">
                                    {risk.category}
                                  </td>
                                  <td className="px-3 py-3">
                                    <LevelBadge level={risk.inherentLevel} />
                                  </td>
                                  <td className="px-3 py-3 text-center text-ink">
                                    {risk.controls.length}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        selectRisk(risk.trackingId)
                                      }
                                      className="rounded-md bg-accent px-3 py-2 text-body-sm font-medium text-white hover:opacity-90"
                                    >
                                      Ver controles
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-body-sm text-muted">
                            Página {safeCurrentPage} de {totalPages}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentPage((page) =>
                                  Math.max(1, page - 1),
                                )
                              }
                              disabled={safeCurrentPage === 1}
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={16} />
                              Anterior
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentPage((page) =>
                                  Math.min(totalPages, page + 1),
                                )
                              }
                              disabled={safeCurrentPage === totalPages}
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Siguiente
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={returnToRiskList}
                className="inline-flex items-center gap-2 text-body-sm font-medium text-accent hover:underline"
              >
                <ArrowLeft size={16} />
                Volver al catálogo de riesgos
              </button>

              {detailLoading ? (
                <p className="text-body-sm text-muted">
                  Cargando controles y evaluaciones…
                </p>
              ) : detailError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                  {detailError}
                </div>
              ) : riskDetail ? (
                <>
                  <section className="rounded-md border border-line bg-surface p-4">
                    <div className="flex flex-col justify-between gap-4 desktop:flex-row">
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-muted">
                          {riskDetail.risk.trackingId} ·{" "}
                          {riskDetail.risk.category}
                        </p>
                        <h2 className="mt-1 text-heading font-semibold text-ink">
                          {riskDetail.risk.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-body-sm text-muted">
                            Riesgo inherente:
                          </span>
                          <LevelBadge
                            level={riskDetail.risk.inherentLevel}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 desktop:min-w-[300px]">
                        <div className="rounded-md border border-line bg-nav p-3">
                          <p className="text-body-sm text-muted">
                            Controles evaluados
                          </p>
                          <p className="mt-1 text-heading font-semibold text-ink">
                            {evaluatedControls}/{totalControls}
                          </p>
                        </div>
                        <div className="rounded-md border border-line bg-nav p-3">
                          <p className="text-body-sm text-muted">
                            Riesgo residual
                          </p>
                          {riskDetail.residualRisk ? (
                            <div className="mt-1">
                              <LevelBadge
                                level={riskDetail.residualRisk.level}
                              />
                              <p className="mt-1 text-caption text-muted">
                                Mediana de{" "}
                                {riskDetail.residualRisk.evaluatedControls}{" "}
                                controles
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1 text-body-sm text-muted">
                              Sin evaluaciones
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="grid items-start gap-5 desktop:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <section className="min-w-0 rounded-md border border-line bg-surface p-4">
                      <h3 className="text-body font-semibold text-ink">
                        Controles asociados
                      </h3>
                      <p className="mt-1 text-body-sm text-muted">
                        Busca, filtra y selecciona el control que deseas
                        evaluar o consultar.
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label
                            htmlFor="control-search"
                            className="mb-1.5 block text-control font-medium text-ink"
                          >
                            Buscar control
                          </label>
                          <div className="relative">
                            <Search
                              size={17}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                            />
                            <input
                              id="control-search"
                              type="search"
                              value={controlSearch}
                              onChange={(event) =>
                                setControlSearch(event.target.value)
                              }
                              placeholder="Buscar por ID, nombre o dominio..."
                              className="w-full rounded-md border border-line-2 bg-surface py-2 pl-9 pr-3 text-body-sm text-ink outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                          <SelectField
                            id="control-status-filter"
                            label="Estado de evaluación"
                            value={controlStatusFilter}
                            options={["Todos", "Evaluados", "Pendientes"]}
                            onChange={setControlStatusFilter}
                          />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <SelectField
                            id="control-sort"
                            label="Ordenar por"
                            value={controlSort}
                            options={[
                              "id-asc",
                              "id-desc",
                              "domain-asc",
                              "pending-first",
                              "evaluated-first",
                            ]}
                            onChange={setControlSort}
                          />
                          <SelectField
                            id="control-page-size"
                            label="Controles por página"
                            value={String(controlsPageSize)}
                            options={PAGE_SIZE_OPTIONS.map(String)}
                            onChange={(value) =>
                              setControlsPageSize(Number(value))
                            }
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                          <p className="text-body-sm text-muted">
                            {filteredControls.length} de {totalControls}{" "}
                            controles
                          </p>
                          <button
                            type="button"
                            onClick={resetControlFilters}
                            disabled={
                              !controlSearch &&
                              controlStatusFilter === "Todos" &&
                              controlSort === "id-asc" &&
                              controlsPageSize === 10
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-line-2 px-2.5 py-1.5 text-caption font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <X size={14} />
                            Limpiar filtros
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {filteredControls.length === 0 ? (
                          <div className="rounded-md border border-dashed border-line-2 p-6 text-center">
                            <Search
                              size={23}
                              className="mx-auto text-muted"
                            />
                            <p className="mt-2 text-body-sm font-medium text-ink">
                              No se encontraron controles
                            </p>
                            <p className="mt-1 text-caption text-muted">
                              Cambia los filtros o utiliza otros términos de
                              búsqueda.
                            </p>
                          </div>
                        ) : (
                          paginatedControls.map((control) => (
                            <button
                              key={control.controlId}
                              type="button"
                              onClick={() => {
                                setSelectedControlId(control.controlId);
                                setSaveMessage(null);
                                setSaveError(null);
                              }}
                              className={`w-full rounded-md border p-3 text-left transition ${
                                selectedControlId === control.controlId
                                  ? "border-accent bg-nav"
                                  : "border-line bg-surface hover:bg-nav"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-body-sm font-semibold text-ink">
                                    {control.trackingId}
                                  </p>
                                  <p className="mt-1 text-body-sm text-ink">
                                    {control.name}
                                  </p>
                                  {control.domain && (
                                    <p className="mt-1 text-caption text-muted">
                                      Dominio: {control.domain}
                                    </p>
                                  )}
                                </div>

                                {control.latestEvaluation ? (
                                  <LevelBadge
                                    level={
                                      control.latestEvaluation.vulnerability
                                    }
                                  />
                                ) : (
                                  <span className="shrink-0 rounded-md border border-line px-2 py-1 text-caption text-muted">
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {splitCatalogValues(
                                  control.auditDepartments,
                                ).map((department) => (
                                  <span
                                    key={department}
                                    className="rounded-md bg-nav px-2 py-1 text-caption text-muted"
                                  >
                                    {department}
                                  </span>
                                ))}
                                {splitCatalogValues(control.areas)
                                  .slice(0, 2)
                                  .map((area) => (
                                    <span
                                      key={area}
                                      className="rounded-md bg-nav px-2 py-1 text-caption text-muted"
                                    >
                                      {area}
                                    </span>
                                  ))}
                                {splitCatalogValues(control.countries)
                                  .slice(0, 1)
                                  .map((country) => (
                                    <span
                                      key={country}
                                      className="rounded-md bg-nav px-2 py-1 text-caption text-muted"
                                    >
                                      {country}
                                    </span>
                                  ))}
                              </div>

                              {control.latestEvaluation && (
                                <p className="mt-2 text-caption text-muted">
                                  Última evaluación:{" "}
                                  {formatDate(
                                    control.latestEvaluation.evaluatedAt,
                                  )}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {filteredControls.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                          <p className="text-body-sm text-muted">
                            Mostrando {controlsPageStart + 1}–
                            {Math.min(
                              controlsPageStart + controlsPageSize,
                              filteredControls.length,
                            )}{" "}
                            de {filteredControls.length} controles · Página{" "}
                            {safeControlsCurrentPage} de{" "}
                            {controlsTotalPages}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setControlsCurrentPage((page) =>
                                  Math.max(1, page - 1),
                                )
                              }
                              disabled={safeControlsCurrentPage === 1}
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={16} />
                              Anterior
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setControlsCurrentPage((page) =>
                                  Math.min(controlsTotalPages, page + 1),
                                )
                              }
                              disabled={
                                safeControlsCurrentPage === controlsTotalPages
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Siguiente
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    
                </section>
                

                    <div className="min-w-0 space-y-5">
                      {selectedControl && (
                        <>
                          <section className="rounded-md border border-line bg-surface p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-body font-semibold text-ink">
                                  Información del control
                                </h3>
                                <p className="mt-1 text-body-sm text-muted">
                                  {selectedControl.trackingId} ·{" "}
                                  {selectedControl.name}
                                </p>
                              </div>
                              <Building2
                                size={21}
                                className="shrink-0 text-accent"
                              />
                            </div>

                            <div className="mt-4">
                              <CatalogInfo control={selectedControl} />
                            </div>
                          </section>

                          <section className="rounded-md border border-line bg-surface p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-body font-semibold text-ink">
                                  Evaluación del control
                                </h3>
                                <p className="mt-1 text-body-sm text-muted">
                                  {selectedControl.trackingId} ·{" "}
                                  {selectedControl.name}
                                </p>
                              </div>
                              <ShieldCheck
                                size={21}
                                className="shrink-0 text-accent"
                              />
                            </div>

                            <p className="mt-3 text-body-sm text-muted">
                              {selectedControl.latestEvaluation
                                ? "Este control ya cuenta con una evaluación. Puedes registrar una nueva; la anterior se conservará en el historial."
                                : "Este control todavía no tiene evaluaciones. Completa los campos para registrar la primera."}
                            </p>

                            <form
                              onSubmit={handleSaveEvaluation}
                              className="mt-4 space-y-4"
                            >
                              
                            <div className="space-y-5">
                                <div className="rounded-md border border-line p-3 sm:p-4">
                                    <RiskAssessmentMatrix
                                    probability={probability}
                                    impact={impact}
                                    onChange={(newProbability, newImpact) => {
                                        setProbability(newProbability);
                                        setImpact(newImpact);
                                    }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <RatingOptionGroup
                                    label="Diseño del control"
                                    value={designRating}
                                    options={CONTROL_RATINGS}
                                    onChange={setDesignRating}
                                    />

                                    <RatingOptionGroup
                                    label="Efectividad del control"
                                    value={effectivenessRating}
                                    options={CONTROL_RATINGS}
                                    onChange={setEffectivenessRating}
                                    />
                                </div>
                                </div>

                              <div>
                                <label
                                  htmlFor="control-comments"
                                  className="mb-1.5 block text-control font-medium text-ink"
                                >
                                  Comentarios (opcional)
                                </label>
                                <textarea
                                  id="control-comments"
                                  value={comments}
                                  onChange={(event) =>
                                    setComments(event.target.value)
                                  }
                                  maxLength={2000}
                                  rows={3}
                                  placeholder="Agrega observaciones o evidencia relevante..."
                                  className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                                />
                                <p className="mt-1 text-right text-caption text-muted">
                                  {comments.length}/2000
                                </p>
                              </div>

                              {saveError && (
                                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                                  <AlertCircle
                                    size={17}
                                    className="mt-0.5 shrink-0"
                                  />
                                  {saveError}
                                </div>
                              )}

                              {saveMessage && (
                                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-body-sm text-emerald-800">
                                  <CheckCircle2
                                    size={17}
                                    className="mt-0.5 shrink-0"
                                  />
                                  {saveMessage}
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-body-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {saving ? (
                                  <>
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                    Guardando evaluación…
                                  </>
                                ) : (
                                  "Guardar evaluación"
                                )}
                              </button>
                            </form>
                          </section>

                          {selectedControl.latestEvaluation && (
                            <section className="rounded-md border border-line bg-surface p-4">
                              <h3 className="text-body font-semibold text-ink">
                                Últimos resultados del control
                              </h3>
                              <p className="mt-1 text-body-sm text-muted">
                                Resultados calculados por el backend con las
                                matrices oficiales.
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-md border border-line bg-nav p-3">
                                  <p className="text-caption text-muted">
                                    Riesgo inherente
                                  </p>
                                  <div className="mt-2">
                                    <LevelBadge
                                      level={
                                        selectedControl.latestEvaluation
                                          .inherentLevel
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="rounded-md border border-line bg-nav p-3">
                                  <p className="text-caption text-muted">
                                    Nivel de control
                                  </p>
                                  <div className="mt-2">
                                    <LevelBadge
                                      level={
                                        selectedControl.latestEvaluation
                                          .controlLevel
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="rounded-md border border-line bg-nav p-3">
                                  <p className="text-caption text-muted">
                                    Vulnerabilidad
                                  </p>
                                  <div className="mt-2">
                                    <LevelBadge
                                      level={
                                        selectedControl.latestEvaluation
                                          .vulnerability
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </section>
                          )}

                          <section className="rounded-md border border-line bg-surface p-4">
                            <div className="flex items-center gap-2">
                              <History size={19} className="text-accent" />
                              <h3 className="text-body font-semibold text-ink">
                                Historial de evaluaciones
                              </h3>
                            </div>

                            {historyLoading ? (
                              <p className="mt-3 text-body-sm text-muted">
                                Cargando historial…
                              </p>
                            ) : historyError ? (
                              <p className="mt-3 text-body-sm text-red-700">
                                {historyError}
                              </p>
                            ) : history && history.evaluations.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                <p className="text-body-sm text-muted">
                                  {history.count}{" "}
                                  {history.count === 1
                                    ? "evaluación registrada"
                                    : "evaluaciones registradas"}. Se muestran
                                  de la más reciente a la más antigua.
                                </p>

                                {history.evaluations.map((evaluation) => (
                                  <article
                                    key={evaluation.evaluationId}
                                    className="rounded-md border border-line p-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-body-sm font-semibold text-ink">
                                        Evaluación #{evaluation.evaluationId}
                                      </p>
                                      <LevelBadge
                                        level={evaluation.vulnerability}
                                      />
                                    </div>

                                    <div className="mt-1 space-y-1">
                                    <p className="text-caption text-muted">
                                        {formatDate(evaluation.evaluatedAt)}
                                    </p>

                                    <p className="text-body-sm text-ink">
                                        <span className="font-medium text-muted">
                                        Evaluada por:{" "}
                                        </span>
                                        {evaluation.evaluatedByUserName || "Usuario no identificado"}
                                    </p>
                                    </div>

                                    <div className="mt-3 grid gap-2 text-body-sm sm:grid-cols-2">
                                      <p>
                                        <span className="text-muted">
                                          Probabilidad:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.probability}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-muted">
                                          Impacto:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.impact}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-muted">
                                          Diseño:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.designRating}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-muted">
                                          Efectividad:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.effectivenessRating}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-muted">
                                          Riesgo inherente:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.inherentLevel}
                                        </span>
                                      </p>
                                      <p>
                                        <span className="text-muted">
                                          Nivel de control:{" "}
                                        </span>
                                        <span className="text-ink">
                                          {evaluation.controlLevel}
                                        </span>
                                      </p>
                                    </div>

                                    {evaluation.comments && (
                                      <p className="mt-3 border-t border-line pt-3 text-body-sm text-muted">
                                        {evaluation.comments}
                                      </p>
                                    )}
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-3 text-body-sm text-muted">
                                Este control todavía no tiene evaluaciones
                                registradas.
                              </p>
                            )}
                          </section>
                        </>
                      )}

                      {!selectedControl && (
                        <div className="rounded-md border border-line bg-surface p-6 text-center text-body-sm text-muted">
                          Selecciona un control para comenzar su evaluación.
                        </div>
                      )}
                    </div>
                    </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </ContentArea>
    </Page>
  );
}
