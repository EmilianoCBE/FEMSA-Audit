import { usePermissions } from "@/features/auth/permissions";
import { useEffect, useMemo, useState } from "react";
import {
  Layers3,
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
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page, PageHeader } from "@/shared/ui";
import { controlEvaluationService } from "../services/controlEvaluationService";
import RiskResidualAnalysis from "../components/RiskResidualAnalysis";

import type {
  ControlEvaluationHistory,
  ControlRating,
  Impact,
  Probability,
  RiskWithControlsDetail,
  RiskWithControlsSummary,
} from "../types/controlEvaluation.types";

const PROBABILITIES: Probability[] = ["Inminente", "Altamente probable", "Probable", "No probable", "Remota"];

const IMPACTS: Impact[] = ["Menor", "Bajo", "Moderado", "Alto", "Crítico"];

const CONTROL_RATINGS: ControlRating[] = ["Inicial", "Funcional", "Definido", "Gestionado", "Optimizado"];

// Matriz oficial de riesgo inherente.
// Filas: probabilidad. Columnas: impacto.
const INHERENT_RISK_MATRIX = [
  ["Bajo", "Moderado", "Alto", "Crítico", "Crítico"],
  ["Bajo", "Moderado", "Alto", "Alto", "Crítico"],
  ["Bajo", "Bajo", "Moderado", "Alto", "Alto"],
  ["Menor", "Bajo", "Bajo", "Moderado", "Moderado"],
  ["Menor", "Menor", "Bajo", "Bajo", "Bajo"],
];

// Matriz oficial de nivel de control.
// Filas: diseño. Columnas: efectividad.
const CONTROL_LEVEL_MATRIX = [
  ["Inicial", "Inicial", "Inicial", "Inicial", "Inicial"],
  ["Inicial", "Funcional", "Funcional", "Funcional", "Funcional"],
  ["Inicial", "Funcional", "Definido", "Definido", "Definido"],
  ["Inicial", "Funcional", "Definido", "Gestionado", "Gestionado"],
  ["Inicial", "Funcional", "Definido", "Gestionado", "Optimizado"],
];

// Matriz oficial de vulnerabilidad.
// Filas: riesgo inherente.
// Columnas: nivel de control, de mayor a menor.
const INHERENT_LEVELS = ["Crítico", "Alto", "Moderado", "Bajo", "Menor"];

const CONTROL_LEVELS = ["Optimizado", "Gestionado", "Definido", "Funcional", "Inicial"];

const VULNERABILITY_MATRIX = [
  ["Bajo", "Moderado", "Alto", "Crítico", "Crítico"],
  ["Bajo", "Moderado", "Moderado", "Alto", "Alto"],
  ["Bajo", "Bajo", "Moderado", "Moderado", "Moderado"],
  ["Menor", "Menor", "Bajo", "Bajo", "Bajo"],
  ["Menor", "Menor", "Menor", "Menor", "Menor"],
];

function getRiskLevelClasses(level: string) {
  switch (level) {
    case "Menor":
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
    case "Bajo":
      return "border-lime-200 bg-lime-100 text-lime-800";
    case "Moderado":
      return "border-yellow-200 bg-yellow-100 text-yellow-800";
    case "Alto":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "Crítico":
      return "border-red-200 bg-red-100 text-red-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getControlLevelClasses(level: string) {
  switch (level) {
    case "Inicial":
      return "border-red-200 bg-red-100 text-red-800";
    case "Funcional":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "Definido":
      return "border-yellow-200 bg-yellow-100 text-yellow-800";
    case "Gestionado":
      return "border-lime-200 bg-lime-100 text-lime-800";
    case "Optimizado":
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

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
  const order = ["menor", "bajo", "moderado", "medio", "alto", "crítico", "critico"];
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
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-body-sm font-medium ${getLevelStyle(level)}`}>
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
      <label htmlFor={id} className="mb-1.5 block text-control font-medium text-ink">
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

  const hasInformation = items.some((item) => splitCatalogValues(item.value).length > 0);

  if (!hasInformation) {
    return <p className="text-caption text-muted">No hay información organizacional disponible para este control.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const values = splitCatalogValues(item.value);

        if (values.length === 0) return null;

        return (
          <div key={item.label} className="min-w-0">
            <p className="text-caption text-muted">{item.label}</p>
            <p className="mt-0.5 break-words text-body-sm font-medium text-ink">{values.join(", ")}</p>
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
        <p className="text-control font-medium text-ink">Probabilidad e impacto</p>
        <p className="mt-1 text-caption text-muted">Selecciona la intersección entre la probabilidad y el impacto.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-0">
          <div className="grid grid-cols-[105px_repeat(5,minmax(0,1fr))] gap-1">
            <div className="flex items-end justify-center pb-2">
              <span className="text-center text-[10px] font-semibold text-muted">Probabilidad ↓</span>
            </div>

            {IMPACTS.map((value) => (
              <div
                key={value}
                className="flex min-h-[42px] items-center justify-center rounded-md bg-nav px-1 text-center text-[10px] font-semibold text-ink"
              >
                {value}
              </div>
            ))}

            {PROBABILITIES.map((probabilityValue, rowIndex) => (
              <div key={probabilityValue} className="contents">
                <div className="flex items-center rounded-md bg-nav px-1.5 text-[11px] font-medium text-ink">
                  {probabilityValue}
                </div>

                {IMPACTS.map((impactValue, columnIndex) => {
                  const isSelected = probability === probabilityValue && impact === impactValue;

                  const level = INHERENT_RISK_MATRIX[rowIndex][columnIndex];

                  return (
                    <button
                      key={`${probabilityValue}-${impactValue}`}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Probabilidad ${probabilityValue}, impacto ${impactValue}, riesgo ${level}`}
                      onClick={() => onChange(probabilityValue, impactValue)}
                      className={`flex min-h-[58px] flex-col items-center justify-center rounded-md border px-0.5 py-1 text-center transition ${getRiskLevelClasses(
                        level,
                      )} ${
                        isSelected
                          ? "border-blue-800 ring-2 ring-blue-700 ring-offset-1 shadow-md"
                          : "hover:border-slate-500"
                      }`}
                    >
                      <span className="text-[10px] font-bold sm:text-xs">{level}</span>

                      {isSelected && (
                        <span className="mt-0.5 text-[9px] font-bold">
                          <CheckCircle2 size={13} className="inline" /> Seleccionado
                        </span>
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
        <div className="mt-2">
          <span
            className={`inline-flex rounded-md border px-3 py-1.5 text-xs font-bold ${getRiskLevelClasses(
              INHERENT_RISK_MATRIX[PROBABILITIES.indexOf(probability)][IMPACTS.indexOf(impact)],
            )}`}
          >
            Riesgo inherente: {INHERENT_RISK_MATRIX[PROBABILITIES.indexOf(probability)][IMPACTS.indexOf(impact)]}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Selector visual para las calificaciones del control.
 */
function ControlLevelMatrix({
  designRating,
  effectivenessRating,
  onChange,
}: {
  designRating: ControlRating;
  effectivenessRating: ControlRating;
  onChange: (design: ControlRating, effectiveness: ControlRating) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Selecciona la intersección entre diseño y efectividad</p>
        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
          Nivel:{" "}
          {CONTROL_LEVEL_MATRIX[CONTROL_RATINGS.indexOf(designRating)][CONTROL_RATINGS.indexOf(effectivenessRating)]}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="w-[135px] border-b border-r border-slate-200 bg-slate-100 p-2 text-left text-xs font-semibold text-slate-700">
                Diseño ↓ / Efectividad →
              </th>

              {CONTROL_RATINGS.map((rating) => (
                <th key={rating} className="border-b border-slate-200 bg-slate-100 p-3 font-semibold text-slate-700">
                  {rating}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {CONTROL_RATINGS.map((design) => (
              <tr key={design}>
                <th className="border-r border-slate-200 bg-slate-50 p-3 text-left font-semibold text-slate-700">
                  {design}
                </th>

                {CONTROL_RATINGS.map((effectiveness) => {
                  const selected = designRating === design && effectivenessRating === effectiveness;

                  const level =
                    CONTROL_LEVEL_MATRIX[CONTROL_RATINGS.indexOf(design)][CONTROL_RATINGS.indexOf(effectiveness)];

                  return (
                    <td key={`${design}-${effectiveness}`} className="border-t border-slate-100 p-1.5">
                      <button
                        type="button"
                        onClick={() => onChange(design, effectiveness)}
                        aria-pressed={selected}
                        className={`min-h-12 w-full rounded-md border px-2 py-2 font-semibold transition-all ${getControlLevelClasses(
                          level,
                        )} ${
                          selected
                            ? "border-blue-800 ring-2 ring-blue-700 ring-offset-1 shadow-md"
                            : "hover:border-slate-500"
                        }`}
                      >
                        {level}
                        {selected && <span className="mt-1 block text-[10px] font-medium">Seleccionado</span>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Las filas representan el diseño del control y las columnas su efectividad. El resultado de la intersección
        determina el nivel de control.
      </p>
    </div>
  );
}

function VulnerabilityMatrix({
  inherentLevel,
  controlLevel,
  vulnerability,
}: {
  inherentLevel: string;
  controlLevel: string;
  vulnerability: string;
}) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          Riesgo inherente: <strong>{inherentLevel || "—"}</strong>
        </span>

        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          Nivel de control: <strong>{controlLevel || "—"}</strong>
        </span>

        <span className={`rounded-lg border px-3 py-2 text-xs font-bold ${getRiskLevelClasses(vulnerability)}`}>
          Vulnerabilidad: {vulnerability || "—"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="w-[135px] border-b border-r border-slate-200 bg-slate-100 p-2 text-left text-xs font-semibold text-slate-700">
                Riesgo inherente ↓ / Control →
              </th>

              {CONTROL_LEVELS.map((level) => (
                <th key={level} className="border-b border-slate-200 bg-slate-100 p-3 font-semibold text-slate-700">
                  {level}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {INHERENT_LEVELS.map((inherent) => (
              <tr key={inherent}>
                <th className="border-r border-slate-200 bg-slate-50 p-3 text-left font-semibold text-slate-700">
                  {inherent}
                </th>

                {CONTROL_LEVELS.map((control) => {
                  const selected = inherentLevel === inherent && controlLevel === control;

                  const level =
                    VULNERABILITY_MATRIX[INHERENT_LEVELS.indexOf(inherent)][CONTROL_LEVELS.indexOf(control)];

                  return (
                    <td key={`${inherent}-${control}`} className="border-t border-slate-100 p-1.5">
                      <div
                        className={`flex min-h-12 items-center justify-center rounded-md border px-2 py-2 font-semibold ${getRiskLevelClasses(level)} ${
                          selected ? "ring-2 ring-blue-700 ring-offset-2" : "opacity-80"
                        }`}
                      >
                        <span>
                          {level}
                          {selected && <span className="mt-1 block text-[10px] font-bold">Resultado</span>}
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

      <p className="mt-2 text-xs text-slate-500">
        Esta matriz es automática. La celda resaltada corresponde a la combinación obtenida en los pasos anteriores.
      </p>
    </div>
  );
}

export function ControlEvaluationPage() {
  const canEdit = usePermissions().permissions.risks === "edit";
  const [risks, setRisks] = useState<RiskWithControlsSummary[]>([]);
  const [risksLoading, setRisksLoading] = useState(true);
  const [risksError, setRisksError] = useState<string | null>(null);

  // Filtros, ordenamiento y paginación del catálogo de riesgos.
  const [riskSearch, setRiskSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [residualLevelFilter, setResidualLevelFilter] = useState("Todos");
  const [riskSort, setRiskSort] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [riskDetail, setRiskDetail] = useState<RiskWithControlsDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  // Filtros, ordenamiento y paginación de controles.
  const [controlSearch, setControlSearch] = useState("");
  const [controlStatusFilter, setControlStatusFilter] = useState("Todos");
  const [controlSort, setControlSort] = useState("id-asc");
  const [controlsCurrentPage, setControlsCurrentPage] = useState(1);
  const [controlsPageSize, setControlsPageSize] = useState(10);

  const [history, setHistory] = useState<ControlEvaluationHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [probability, setProbability] = useState<Probability>("Probable");
  const [impact, setImpact] = useState<Impact>("Moderado");
  const [designRating, setDesignRating] = useState<ControlRating>("Definido");
  const [effectivenessRating, setEffectivenessRating] = useState<ControlRating>("Definido");
  const [comments, setComments] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedControl = riskDetail?.controls.find((control) => control.controlId === selectedControlId);

  // Resultados calculados en tiempo real con las matrices oficiales.
  const calculatedInherentLevel = INHERENT_RISK_MATRIX[PROBABILITIES.indexOf(probability)][IMPACTS.indexOf(impact)];

  const calculatedControlLevel =
    CONTROL_LEVEL_MATRIX[CONTROL_RATINGS.indexOf(designRating)][CONTROL_RATINGS.indexOf(effectivenessRating)];

  const calculatedVulnerability =
    VULNERABILITY_MATRIX[INHERENT_LEVELS.indexOf(calculatedInherentLevel)][
      CONTROL_LEVELS.indexOf(calculatedControlLevel)
    ];

  // Sincronizar el formulario con la última evaluación del control seleccionado.
  useEffect(() => {
    if (!selectedControl) {
      return;
    }

    const evaluation = selectedControl.latestEvaluation;

    if (evaluation) {
      setProbability(evaluation.probability);
      setImpact(evaluation.impact);
      setDesignRating(evaluation.designRating);
      setEffectivenessRating(evaluation.effectivenessRating);
    } else {
      setProbability("Probable");
      setImpact("Moderado");
      setDesignRating("Definido");
      setEffectivenessRating("Definido");
    }

    setComments("");
    setSaveError(null);
    setSaveMessage(null);
  }, [selectedControl]);

  // Opciones de filtros organizacionales.

  const categories = Array.from(new Set(risks.map((risk) => risk.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  const residualLevels = Array.from(
    new Set(risks.map((risk) => risk.residualRisk?.level).filter((level): level is string => Boolean(level))),
  ).sort((a, b) => getInherentLevelOrder(a) - getInherentLevelOrder(b));

  const filteredRisks = risks
    .filter((risk) => {
      const query = riskSearch.trim().toLocaleLowerCase("es");

      const matchesSearch =
        !query ||
        risk.name.toLocaleLowerCase("es").includes(query) ||
        risk.trackingId.toLocaleLowerCase("es").includes(query);

      const matchesCategory = categoryFilter === "Todas" || risk.category === categoryFilter;

      const matchesLevel =
        residualLevelFilter === "Todos" ||
        (residualLevelFilter === "Pendiente de evaluación"
          ? risk.residualRisk === null
          : risk.residualRisk?.level === residualLevelFilter);

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
          if (!a.residualRisk) return b.residualRisk ? 1 : 0;
          if (!b.residualRisk) return -1;
          return getInherentLevelOrder(a.residualRisk.level) - getInherentLevelOrder(b.residualRisk.level);

        case "level-desc":
          if (!a.residualRisk) return b.residualRisk ? 1 : 0;
          if (!b.residualRisk) return -1;
          return getInherentLevelOrder(b.residualRisk.level) - getInherentLevelOrder(a.residualRisk.level);
        default:
          return a.name.localeCompare(b.name, "es", {
            sensitivity: "base",
          });
      }
    });

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const paginatedRisks = filteredRisks.slice(pageStart, pageStart + pageSize);

  // Filtrar y ordenar los controles del riesgo seleccionado.
  const filteredControls = useMemo(() => {
    if (!riskDetail) return [];

    const query = controlSearch.trim().toLocaleLowerCase("es");

    return riskDetail.controls
      .filter((control) => {
        const searchableText = [control.trackingId, control.name, control.domain ?? ""]
          .join(" ")
          .toLocaleLowerCase("es");

        const matchesSearch = !query || searchableText.includes(query);

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
            return Number(a.latestEvaluation !== null) - Number(b.latestEvaluation !== null);
          case "evaluated-first":
            return Number(b.latestEvaluation !== null) - Number(a.latestEvaluation !== null);
          default:
            return a.trackingId.localeCompare(b.trackingId, "es", {
              numeric: true,
              sensitivity: "base",
            });
        }
      });
  }, [riskDetail, controlSearch, controlStatusFilter, controlSort]);

  const controlsTotalPages = Math.max(1, Math.ceil(filteredControls.length / controlsPageSize));

  const safeControlsCurrentPage = Math.min(controlsCurrentPage, controlsTotalPages);

  const controlsPageStart = (safeControlsCurrentPage - 1) * controlsPageSize;

  const paginatedControls = filteredControls.slice(controlsPageStart, controlsPageStart + controlsPageSize);

  function resetRiskFilters() {
    setRiskSearch("");
    setCategoryFilter("Todas");
    setResidualLevelFilter("Todos");
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
          setRisksError(getErrorMessage(error, "No se pudo cargar el catálogo de riesgos."));
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
        const response = await controlEvaluationService.getRiskDetail(riskId);

        if (!cancelled) {
          setRiskDetail(response);
          setSelectedControlId(response.controls[0]?.controlId ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(getErrorMessage(error, "No se pudo cargar el detalle del riesgo."));
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
  }, [controlSearch, controlStatusFilter, controlSort, controlsPageSize]);

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
        const response = await controlEvaluationService.getControlHistory(controlId);

        if (!cancelled) {
          setHistory(response);
        }
      } catch (error) {
        if (!cancelled) {
          setHistory(null);
          setHistoryError(getErrorMessage(error, "No se pudo cargar el historial del control."));
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

  async function handleSaveEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit || selectedControlId === null || saving) {
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
        const updatedDetail = await controlEvaluationService.getRiskDetail(selectedRiskId);
        setRiskDetail(updatedDetail);
      }

      // Actualizar el historial sin eliminar las evaluaciones anteriores.
      const updatedHistory = await controlEvaluationService.getControlHistory(selectedControlId);
      setHistory(updatedHistory);
    } catch (error) {
      setSaveError(getErrorMessage(error, "No se pudo guardar la evaluación del control."));
    } finally {
      setSaving(false);
    }
  }

  const evaluatedControls = riskDetail?.controls.filter((control) => control.latestEvaluation !== null).length ?? 0;

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
              <section className="grid gap-4 sm:grid-cols-2">
                {/* Total de riesgos */}
                <div className="group relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-body-sm font-medium text-muted">Riesgos registrados</p>

                      <p className="mt-3 text-4xl font-bold tracking-tight text-ink">
                        {risksLoading ? "…" : risks.length}
                      </p>

                      <p className="mt-2 text-body-sm text-muted">Riesgos disponibles en el catálogo.</p>
                    </div>

                    <div className="rounded-xl border border-line bg-nav p-3 text-accent">
                      <ClipboardList size={25} />
                    </div>
                  </div>

                  <div className="mt-5 h-1 overflow-hidden rounded-full bg-nav">
                    <div className="h-full w-full rounded-full bg-accent" />
                  </div>
                </div>

                {/* Total de controles */}
                <div className="group relative overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-body-sm font-medium text-muted">Controles registrados</p>

                      <p className="mt-3 text-4xl font-bold tracking-tight text-ink">
                        {risksLoading ? "…" : risks.reduce((total, risk) => total + risk.controls.length, 0)}
                      </p>

                      <p className="mt-2 text-body-sm text-muted">Controles relacionados con los riesgos.</p>
                    </div>

                    <div className="rounded-xl border border-line bg-nav p-3 text-accent">
                      <ShieldCheck size={25} />
                    </div>
                  </div>

                  <div className="mt-5 h-1 overflow-hidden rounded-full bg-nav">
                    <div className="h-full w-full rounded-full bg-accent" />
                  </div>
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-md border border-line bg-nav p-2 text-accent">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="m-0 text-body font-semibold text-ink">Catálogo de riesgos</h2>
                    <p className="mt-1 text-body-sm text-muted">
                      Selecciona un riesgo para consultar y evaluar sus controles asociados.
                    </p>
                  </div>
                </div>

                {risksLoading ? (
                  <p className="text-body-sm text-muted">Cargando riesgos…</p>
                ) : risksError ? (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    {risksError}
                  </div>
                ) : risks.length === 0 ? (
                  <p className="text-body-sm text-muted">No hay riesgos registrados.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="xl:col-span-2">
                        <label htmlFor="risk-search" className="mb-1.5 block text-control font-medium text-ink">
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
                        <label htmlFor="risk-level-filter" className="mb-1.5 block text-control font-medium text-ink">
                          Riesgo residual
                        </label>

                        <select
                          id="risk-level-filter"
                          value={residualLevelFilter}
                          onChange={(event) => {
                            setResidualLevelFilter(event.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                        >
                          <option value="Todos">Todos los niveles</option>
                          <option value="Pendiente de evaluación">Pendiente de evaluación</option>
                          {residualLevels.map((level) => (
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
                          <label htmlFor="risk-sort" className="mb-1.5 block text-control font-medium text-ink">
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
                            <option value="level-asc">Nivel residual (A-Z)</option>
                            <option value="level-desc">Nivel residual (Z-A)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="risk-page-size" className="mb-1.5 block text-control font-medium text-ink">
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
                          residualLevelFilter === "Todos" &&
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
                        <p className="mt-2 text-body-sm font-medium text-ink">No se encontraron riesgos</p>
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
                                <th className="px-3 py-3 font-medium">Riesgo residual</th>
                                <th className="px-3 py-3 text-center font-medium">Controles</th>
                                <th className="px-3 py-3 text-right font-medium">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedRisks.map((risk) => (
                                <tr key={risk.riskId} className="border-b border-line last:border-0">
                                  <td className="px-3 py-3 font-medium text-ink">{risk.trackingId}</td>
                                  <td className="max-w-[280px] px-3 py-3 text-ink">{risk.name}</td>
                                  <td className="px-3 py-3 text-muted">{risk.category}</td>
                                  <td className="px-3 py-3">
                                    {risk.residualRisk ? (
                                      <div className="flex flex-col items-start gap-1">
                                        <LevelBadge level={risk.residualRisk.level} />
                                        <span className="text-xs text-muted">
                                          {risk.residualRisk.evaluatedControls} controles evaluados
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted">Pendiente de evaluación</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-center text-ink">{risk.controls.length}</td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => selectRisk(risk.trackingId)}
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
                              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                              disabled={safeCurrentPage === 1}
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={16} />
                              Anterior
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
                <p className="text-body-sm text-muted">Cargando controles y evaluaciones…</p>
              ) : detailError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                  {detailError}
                </div>
              ) : riskDetail ? (
                <>
                  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Perfil del riesgo
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {riskDetail.risk.trackingId} · {riskDetail.risk.category}
                          </p>
                        </div>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          Evaluación por controles
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-5 p-5 desktop:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">Nombre del riesgo</p>

                        <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900">
                          {riskDetail.risk.name}
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <ClipboardList size={17} />
                            <p className="text-xs font-medium">Controles evaluados</p>
                          </div>

                          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                            {evaluatedControls}
                            <span className="text-lg font-medium text-slate-400">/{totalControls}</span>
                          </p>

                          <p className="mt-1 text-xs text-slate-500">Controles con evaluación</p>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all"
                              style={{
                                width: `${totalControls > 0 ? (evaluatedControls / totalControls) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <ShieldCheck size={17} />
                            <p className="text-xs font-medium">Riesgo residual</p>
                          </div>

                          {riskDetail.residualRisk ? (
                            <>
                              <div className="mt-3">
                                <LevelBadge level={riskDetail.residualRisk.level} />
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                Mediana de {riskDetail.residualRisk.evaluatedControls} controles
                              </p>
                            </>
                          ) : (
                            <p className="mt-3 text-sm font-medium text-slate-500">Sin evaluaciones</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <RiskResidualAnalysis detail={riskDetail} />

                  <div className="grid items-start gap-6 desktop:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                          <Layers3 size={21} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Catálogo de controles</h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {filteredControls.length} controles encontrados
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-body-sm text-muted">
                        Busca, filtra y selecciona el control que deseas evaluar o consultar.
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label htmlFor="control-search" className="mb-1.5 block text-control font-medium text-ink">
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
                              onChange={(event) => setControlSearch(event.target.value)}
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
                            options={["id-asc", "id-desc", "domain-asc", "pending-first", "evaluated-first"]}
                            onChange={setControlSort}
                          />
                          <SelectField
                            id="control-page-size"
                            label="Controles por página"
                            value={String(controlsPageSize)}
                            options={PAGE_SIZE_OPTIONS.map(String)}
                            onChange={(value) => setControlsPageSize(Number(value))}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                          <p className="text-body-sm text-muted">
                            {filteredControls.length} de {totalControls} controles
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
                            <Search size={23} className="mx-auto text-muted" />
                            <p className="mt-2 text-body-sm font-medium text-ink">No se encontraron controles</p>
                            <p className="mt-1 text-caption text-muted">
                              Cambia los filtros o utiliza otros términos de búsqueda.
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
                              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                selectedControlId === control.controlId
                                  ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-body-sm font-semibold text-ink">{control.trackingId}</p>
                                  <p className="mt-1 text-body-sm text-ink">{control.name}</p>
                                  {control.domain && (
                                    <p className="mt-1 text-caption text-muted">Dominio: {control.domain}</p>
                                  )}
                                </div>

                                {control.latestEvaluation ? (
                                  <LevelBadge level={control.latestEvaluation.vulnerability} />
                                ) : (
                                  <span className="shrink-0 rounded-md border border-line px-2 py-1 text-caption text-muted">
                                    Pendiente
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {splitCatalogValues(control.auditDepartments).map((department) => (
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
                                    <span key={area} className="rounded-md bg-nav px-2 py-1 text-caption text-muted">
                                      {area}
                                    </span>
                                  ))}
                                {splitCatalogValues(control.countries)
                                  .slice(0, 1)
                                  .map((country) => (
                                    <span key={country} className="rounded-md bg-nav px-2 py-1 text-caption text-muted">
                                      {country}
                                    </span>
                                  ))}
                              </div>

                              {control.latestEvaluation && (
                                <p className="mt-2 text-caption text-muted">
                                  Última evaluación: {formatDate(control.latestEvaluation.evaluatedAt)}
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
                            {Math.min(controlsPageStart + controlsPageSize, filteredControls.length)} de{" "}
                            {filteredControls.length} controles · Página {safeControlsCurrentPage} de{" "}
                            {controlsTotalPages}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setControlsCurrentPage((page) => Math.max(1, page - 1))}
                              disabled={safeControlsCurrentPage === 1}
                              className="inline-flex items-center gap-1 rounded-md border border-line-2 px-3 py-2 text-body-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ChevronLeft size={16} />
                              Anterior
                            </button>

                            <button
                              type="button"
                              onClick={() => setControlsCurrentPage((page) => Math.min(controlsTotalPages, page + 1))}
                              disabled={safeControlsCurrentPage === controlsTotalPages}
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
                                <h3 className="text-body font-semibold text-ink">Información del control</h3>
                                <p className="mt-1 text-body-sm text-muted">
                                  {selectedControl.trackingId} · {selectedControl.name}
                                </p>
                              </div>
                              <Building2 size={21} className="shrink-0 text-accent" />
                            </div>

                            <div className="mt-4">
                              <CatalogInfo control={selectedControl} />
                            </div>
                          </section>

                          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50/70 p-5">
                              <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-blue-100 p-3 text-blue-800">
                                  <ShieldCheck size={23} />
                                </div>

                                <div className="min-w-0">
                                  <h3 className="text-lg font-bold text-slate-900">Evaluación del control</h3>

                                  <p className="mt-1 text-sm font-medium text-slate-600">
                                    {selectedControl.trackingId}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">{selectedControl.name}</p>
                                </div>
                              </div>
                            </div>
                            <p className="mx-5 mt-3 text-body-sm text-muted">
                              {selectedControl.latestEvaluation
                                ? "Este control ya cuenta con una evaluación. Puedes registrar una nueva; la anterior se conservará en el historial."
                                : "Este control todavía no tiene evaluaciones. Completa los campos para registrar la primera."}
                            </p>

                            <form onSubmit={handleSaveEvaluation} className="space-y-5 p-5">
                              <div className="space-y-4">
                                {/* PASO 1: RIESGO INHERENTE */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-slate-300">
                                  <div className="mb-3 flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                                      1
                                    </span>

                                    <div>
                                      <h4 className="text-body font-semibold text-ink">
                                        Evaluación del riesgo inherente
                                      </h4>
                                      <p className="mt-1 text-body-sm text-muted">
                                        Determina la probabilidad de ocurrencia y el impacto del riesgo antes de
                                        considerar la efectividad de los controles.
                                      </p>
                                    </div>
                                  </div>

                                  <RiskAssessmentMatrix
                                    probability={probability}
                                    impact={impact}
                                    onChange={(newProbability, newImpact) => {
                                      setProbability(newProbability);
                                      setImpact(newImpact);
                                    }}
                                  />
                                </div>

                                {/* PASO 2: NIVEL DE CONTROL */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-slate-300">
                                  <div className="mb-3 flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                                      2
                                    </span>

                                    <div>
                                      <h4 className="text-body font-semibold text-ink">
                                        Evaluación del nivel de control
                                      </h4>
                                      <p className="mt-1 text-body-sm text-muted">
                                        Evalúa conjuntamente el diseño y la efectividad del control. Selecciona la
                                        combinación correspondiente en la matriz para determinar su nivel.
                                      </p>
                                    </div>
                                  </div>

                                  <ControlLevelMatrix
                                    designRating={designRating}
                                    effectivenessRating={effectivenessRating}
                                    onChange={(newDesign, newEffectiveness) => {
                                      setDesignRating(newDesign);
                                      setEffectivenessRating(newEffectiveness);
                                    }}
                                  />
                                </div>

                                {/* PASO 3: VULNERABILIDAD */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-slate-300">
                                  <div className="mb-3 flex items-start gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                                      3
                                    </span>

                                    <div>
                                      <h4 className="text-body font-semibold text-ink">
                                        Determinación de la vulnerabilidad
                                      </h4>
                                      <p className="mt-1 text-body-sm text-muted">
                                        La vulnerabilidad se calcula automáticamente a partir del riesgo inherente y el
                                        nivel de control obtenidos en los pasos anteriores. No requiere una calificación
                                        manual.
                                      </p>
                                    </div>
                                  </div>

                                  <VulnerabilityMatrix
                                    inherentLevel={calculatedInherentLevel}
                                    controlLevel={calculatedControlLevel}
                                    vulnerability={calculatedVulnerability}
                                  />
                                </div>
                              </div>

                              <div className="rounded-lg border border-line bg-surface p-4">
                                <div className="mb-3">
                                  <h4 className="text-body font-semibold text-ink">Comentarios y evidencia</h4>
                                  <p className="mt-1 text-body-sm text-muted">
                                    Registra observaciones, justificaciones o evidencia relevante para respaldar la
                                    evaluación.
                                  </p>
                                </div>
                                <label
                                  htmlFor="control-comments"
                                  className="mb-1.5 block text-control font-medium text-ink"
                                >
                                  Comentarios (opcional)
                                </label>
                                <textarea
                                  id="control-comments"
                                  value={comments}
                                  onChange={(event) => setComments(event.target.value)}
                                  maxLength={2000}
                                  rows={3}
                                  placeholder="Agrega observaciones o evidencia relevante..."
                                  className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                                />
                                <p className="mt-1 text-right text-caption text-muted">{comments.length}/2000</p>
                              </div>

                              {saveError && (
                                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-body-sm text-red-800">
                                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                                  {saveError}
                                </div>
                              )}

                              {saveMessage && (
                                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-body-sm text-emerald-800">
                                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                                  {saveMessage}
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={!canEdit || saving}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {saving ? (
                                  <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Guardando evaluación…
                                  </>
                                ) : (
                                  "Guardar evaluación"
                                )}
                              </button>
                            </form>
                          </section>

                          {selectedControl.latestEvaluation && (
                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                              <h3 className="text-body font-semibold text-ink">Últimos resultados del control</h3>
                              <p className="mt-1 text-body-sm text-muted">
                                Resultados calculados por el backend con las matrices oficiales.
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-caption text-muted">Riesgo inherente</p>
                                  <div className="mt-2">
                                    <LevelBadge level={selectedControl.latestEvaluation.inherentLevel} />
                                  </div>
                                </div>
                                <div className="rounded-md border border-line bg-nav p-3">
                                  <p className="text-caption text-muted">Nivel de control</p>
                                  <div className="mt-2">
                                    <LevelBadge level={selectedControl.latestEvaluation.controlLevel} />
                                  </div>
                                </div>
                                <div className="rounded-md border border-line bg-nav p-3">
                                  <p className="text-caption text-muted">Vulnerabilidad</p>
                                  <div className="mt-2">
                                    <LevelBadge level={selectedControl.latestEvaluation.vulnerability} />
                                  </div>
                                </div>
                              </div>
                            </section>
                          )}

                          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 p-5">
                              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-800">
                                <History size={21} />
                              </div>

                              <div>
                                <h3 className="text-lg font-bold text-slate-900">Historial de evaluaciones</h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  Seguimiento de las evaluaciones anteriores de este control.
                                </p>
                              </div>
                            </div>

                            {historyLoading ? (
                              <p className="mx-5 mt-3 text-body-sm text-muted">Cargando historial…</p>
                            ) : historyError ? (
                              <p className="mt-3 text-body-sm text-red-700">{historyError}</p>
                            ) : history && history.evaluations.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                <p className="mx-5 mb-4 mt-3 text-body-sm text-muted">
                                  {history.count}{" "}
                                  {history.count === 1 ? "evaluación registrada" : "evaluaciones registradas"}. Se
                                  muestran de la más reciente a la más antigua.
                                </p>

                                {history.evaluations.map((evaluation) => (
                                  <article
                                    key={evaluation.evaluationId}
                                    className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-body-sm font-semibold text-ink">
                                        Evaluación #{evaluation.evaluationId}
                                      </p>
                                      <LevelBadge level={evaluation.vulnerability} />
                                    </div>

                                    <div className="mt-1 space-y-1">
                                      <p className="text-caption text-muted">{formatDate(evaluation.evaluatedAt)}</p>

                                      <p className="text-body-sm text-ink">
                                        <span className="font-medium text-muted">Evaluada por: </span>
                                        {evaluation.evaluatedByUserName || "Usuario no identificado"}
                                      </p>
                                    </div>

                                    <div className="mt-3 grid gap-2 text-body-sm sm:grid-cols-2">
                                      <p>
                                        <span className="text-muted">Probabilidad: </span>
                                        <span className="text-ink">{evaluation.probability}</span>
                                      </p>
                                      <p>
                                        <span className="text-muted">Impacto: </span>
                                        <span className="text-ink">{evaluation.impact}</span>
                                      </p>
                                      <p>
                                        <span className="text-muted">Diseño: </span>
                                        <span className="text-ink">{evaluation.designRating}</span>
                                      </p>
                                      <p>
                                        <span className="text-muted">Efectividad: </span>
                                        <span className="text-ink">{evaluation.effectivenessRating}</span>
                                      </p>
                                      <p>
                                        <span className="text-muted">Riesgo inherente: </span>
                                        <span className="text-ink">{evaluation.inherentLevel}</span>
                                      </p>
                                      <p>
                                        <span className="text-muted">Nivel de control: </span>
                                        <span className="text-ink">{evaluation.controlLevel}</span>
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
                              <p className="mx-5 mb-4 mt-3text-body-sm text-muted">
                                Este control todavía no tiene evaluaciones registradas.
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
