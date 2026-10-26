import { ROUTES } from "@/shared/routing/routes";

export const REPORT_PATH = ROUTES.reports;
export const KINDS = { audits: "Auditorias", findings: "Hallazgos", plans: "Planes de accion" } as const;
export type ReportKind = keyof typeof KINDS;
export type ReportFilters = {
  search: string;
  businessUnit: string;
  status: string;
  severity: string;
  start: string;
  end: string;
};
export const EMPTY_FILTERS: ReportFilters = {
  search: "",
  businessUnit: "",
  status: "",
  severity: "",
  start: "",
  end: "",
};
export type ReportField = { id: string; label: string; type?: "date" | "number" };
export type ReportRow = Record<string, string | number | null>;
export type Indicator = { id: string; label: string; value: number; percent: boolean };
export type ReportData = {
  kind: ReportKind;
  fields: ReportField[];
  rows: ReportRow[];
  filters: ReportFilters;
  indicators: Indicator[];
  source: string;
  scope: string;
  queriedAt: string;
};
export type ReportSnapshot = {
  title: string;
  generatedAt: Date;
  queriedAt: string;
  source: string;
  scope: string;
  kind: ReportKind;
  filters: string;
  fields: ReportField[];
  rows: (string | number | null)[][];
  indicators: Indicator[];
};

// La vista previa y los archivos usan la misma respuesta de la API
export function buildSnapshot(
  data: ReportData,
  fields: string[],
  indicators: string[],
  title: string,
  generatedAt = new Date(),
): ReportSnapshot {
  const selected = data.fields.filter((field) => fields.includes(field.id));
  const labels: Record<string, string> = {
    search: "Busqueda",
    businessUnit: "Unidad",
    status: "Estado",
    severity: "Severidad o prioridad",
    start: "Desde",
    end: "Hasta",
  };
  return {
    title: title.trim() || `Reporte de ${KINDS[data.kind].toLowerCase()}`,
    generatedAt,
    queriedAt: data.queriedAt,
    source: data.source,
    scope: data.scope,
    kind: data.kind,
    filters:
      Object.entries(data.filters)
        .filter(([key, value]) => labels[key] && value)
        .map(([key, value]) => `${labels[key]}: ${value}`)
        .join(" | ") || "Sin filtros",
    fields: selected,
    rows: data.rows.map((row) => selected.map((field) => row[field.id] ?? null)),
    indicators: data.indicators.filter((item) => indicators.includes(item.id)),
  };
}
export function displayValue(value: string | number | null, field: ReportField): string | number {
  if (value === null) return "Sin dato";
  if (field.type === "date") return String(value).slice(0, 10);
  return value;
}
