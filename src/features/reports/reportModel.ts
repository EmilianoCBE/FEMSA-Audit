import type { Finding } from "@/features/inbox/types";
import { STATUS_CONFIG, SEVERITY_CONFIG } from "@/features/inbox/lib/findings";

export const REPORT_PATH = "/reportes/ejecutivos";
export const SOURCE_NOTICE = "Datos de ejemplo de la bandeja — no usar para decisiones reales";
export type ReportFilters = { search: string; businessUnit: string; status: string; severity: string };
export const EMPTY_FILTERS: ReportFilters = { search: "", businessUnit: "", status: "", severity: "" };
export const FIELDS = [
  { id: "id", label: "Folio" },
  { id: "title", label: "Hallazgo" },
  { id: "businessUnit", label: "Unidad de negocio" },
  { id: "auditName", label: "Auditoria" },
  { id: "status", label: "Estado" },
  { id: "severity", label: "Severidad" },
  { id: "waitingDays", label: "Dias en espera" },
] as const;
export type FieldId = (typeof FIELDS)[number]["id"];
export const INDICATORS = [
  { id: "total", label: "Total de hallazgos" },
  { id: "open", label: "Hallazgos abiertos" },
  { id: "high", label: "Abiertos de severidad alta" },
  { id: "closedPercent", label: "Porcentaje de cierre" },
] as const;
export type IndicatorId = (typeof INDICATORS)[number]["id"];
export type ReportSnapshot = {
  title: string;
  generatedAt: Date;
  filters: string;
  fields: { id: FieldId; label: string }[];
  rows: (string | number | null)[][];
  indicators: { label: string; value: number; percent: boolean }[];
};

// Aqui usamos los mismos filtros para la vista previa y los archivos
export function filterFindings(rows: Finding[], filters: ReportFilters): Finding[] {
  const search = filters.search.trim().toLocaleLowerCase("es");
  return rows.filter(
    (row) =>
      (!filters.businessUnit || row.businessUnit === filters.businessUnit) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.severity || row.severity === filters.severity) &&
      (!search || [row.id, row.title, row.auditName].some((value) => value.toLocaleLowerCase("es").includes(search))),
  );
}
export function cellValue(row: Finding, field: FieldId): string | number | null {
  if (field === "status") return STATUS_CONFIG[row.status].label;
  if (field === "severity") return SEVERITY_CONFIG[row.severity].label;
  return row[field];
}
export function buildSnapshot(
  rows: Finding[],
  fields: FieldId[],
  indicators: IndicatorId[],
  filters: ReportFilters,
  title: string,
  generatedAt = new Date(),
): ReportSnapshot {
  const filtered = filterFindings(rows, filters);
  const closed = filtered.filter((row) => row.status === "closed").length;
  const values: Record<IndicatorId, number> = {
    total: filtered.length,
    open: filtered.length - closed,
    high: filtered.filter((row) => row.status !== "closed" && row.severity === "high").length,
    closedPercent: filtered.length ? (closed / filtered.length) * 100 : 0,
  };
  const selectedFields = FIELDS.filter((field) => fields.includes(field.id));
  return {
    title: title.trim() || "Reporte de hallazgos GRC",
    generatedAt,
    filters:
      [
        filters.search && `Busqueda: ${filters.search}`,
        filters.businessUnit && `Unidad: ${filters.businessUnit}`,
        filters.status && `Estado: ${STATUS_CONFIG[filters.status as Finding["status"]].label}`,
        filters.severity && `Severidad: ${SEVERITY_CONFIG[filters.severity as Finding["severity"]].label}`,
      ]
        .filter(Boolean)
        .join(" | ") || "Sin filtros",
    fields: selectedFields,
    rows: filtered.map((row) => selectedFields.map((field) => cellValue(row, field.id))),
    indicators: INDICATORS.filter((item) => indicators.includes(item.id)).map((item) => ({
      label: item.label,
      value: values[item.id],
      percent: item.id === "closedPercent",
    })),
  };
}
