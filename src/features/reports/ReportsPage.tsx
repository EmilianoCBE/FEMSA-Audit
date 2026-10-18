import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import type { Finding } from "@/features/inbox/types";
import { STATUS_CONFIG, SEVERITY_CONFIG } from "@/features/inbox/lib/findings";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, Page, PageHeader, QueryState } from "@/shared/ui";
import {
  buildSnapshot,
  EMPTY_FILTERS,
  FIELDS,
  INDICATORS,
  SOURCE_NOTICE,
  type FieldId,
  type IndicatorId,
  type ReportFilters,
} from "./reportModel";
import { reportService } from "./reportService";
import { createExcel, createPdf, downloadReport } from "./reportExport";

const inputClass =
  "min-h-11 w-full rounded border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink focus:outline-2 focus:outline-accent";

export function ReportsPage() {
  const query = useQuery(reportService.list);
  return (
    <Page>
      <PageHeader
        title="Reportes"
        description="Elige la informacion que necesitas y descargala para tus reuniones o seguimiento"
      />
      <ContentArea>
        <p className="mb-4 rounded border border-line-2 bg-nav p-3 text-body-sm" role="note">
          {SOURCE_NOTICE} La fuente real de hallazgos esta pendiente de integracion
        </p>
        <QueryState query={query}>{(rows) => <ReportBuilder rows={rows} />}</QueryState>
      </ContentArea>
    </Page>
  );
}

function ReportBuilder({ rows }: { rows: Finding[] }) {
  const [title, setTitle] = useState("Reporte de hallazgos GRC");
  const [filters, setFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [fields, setFields] = useState<FieldId[]>(FIELDS.map((field) => field.id));
  const [indicators, setIndicators] = useState<IndicatorId[]>(INDICATORS.map((item) => item.id));
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const report = buildSnapshot(rows, fields, indicators, filters, title);
  const disabled = exporting !== null || !fields.length || !report.rows.length;

  function updateFilter(key: keyof ReportFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setMessage("");
  }
  async function exportFile(format: "xlsx" | "pdf") {
    if (disabled) return;
    setExporting(format);
    setError("");
    setMessage("");
    // Tomamos una copia para que el archivo respete la seleccion al dar clic
    const snapshot = buildSnapshot(rows, fields, indicators, filters, title);
    try {
      const blob = await (format === "xlsx" ? createExcel(snapshot) : createPdf(snapshot));
      downloadReport(blob, format);
      setMessage(`Archivo ${format === "xlsx" ? "Excel" : "PDF"} generado con ${snapshot.rows.length} registros`);
    } catch {
      setError("No se pudo generar el archivo Intenta de nuevo");
    } finally {
      setExporting(null);
    }
  }
  return (
    <div className="space-y-5">
      <fieldset disabled={exporting !== null} className="space-y-5 disabled:opacity-60">
        <legend className="mb-3 text-body font-semibold">1 Configura tu reporte</legend>
        <div className="grid gap-4 desktop:grid-cols-2">
          <label className="space-y-1 text-body-sm">
            Nombre del reporte
            <input
              className={inputClass}
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-body-sm">
            Contenido
            <select className={inputClass} value="findings" onChange={() => {}}>
              <option value="findings">Hallazgos</option>
            </select>
          </label>
        </div>
        <p className="text-body-sm text-muted">
          Auditorias riesgos controles y planes de accion se agregaran cuando tengan una fuente de consulta disponible
        </p>
        <fieldset className="rounded border border-line bg-surface p-4">
          <legend className="px-1 text-body-sm font-semibold">Columnas del archivo</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {FIELDS.map((field) => (
              <label key={field.id} className="flex min-h-11 items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={fields.includes(field.id)}
                  onChange={(event) =>
                    setFields((current) =>
                      event.target.checked ? [...current, field.id] : current.filter((id) => id !== field.id),
                    )
                  }
                />
                {field.label}
              </label>
            ))}
          </div>
          {!fields.length && (
            <p role="alert" className="text-body-sm text-red">
              Selecciona al menos una columna para exportar
            </p>
          )}
        </fieldset>
        <fieldset className="rounded border border-line bg-surface p-4">
          <legend className="px-1 text-body-sm font-semibold">Indicadores opcionales</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {INDICATORS.map((item) => (
              <label key={item.id} className="flex min-h-11 items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={indicators.includes(item.id)}
                  onChange={(event) =>
                    setIndicators((current) =>
                      event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
                {item.label}
              </label>
            ))}
          </div>
          <p className="text-control text-muted">
            Se calculan con los registros filtrados Porcentaje de cierre = cerrados / total
          </p>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-body font-semibold">2 Filtra la informacion</legend>
          <div className="grid gap-3 desktop:grid-cols-4">
            <label className="space-y-1 text-body-sm">
              Buscar
              <input
                type="search"
                maxLength={150}
                className={inputClass}
                value={filters.search}
                placeholder="Folio hallazgo o auditoria"
                onChange={(event) => updateFilter("search", event.target.value)}
              />
            </label>
            <label className="space-y-1 text-body-sm">
              Unidad de negocio
              <select
                className={inputClass}
                value={filters.businessUnit}
                onChange={(event) => updateFilter("businessUnit", event.target.value)}
              >
                <option value="">Todas</option>
                {[...new Set(rows.map((row) => row.businessUnit))].sort().map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-body-sm">
              Estado
              <select
                className={inputClass}
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_CONFIG).map(([id, value]) => (
                  <option key={id} value={id}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-body-sm">
              Severidad
              <select
                className={inputClass}
                value={filters.severity}
                onChange={(event) => updateFilter("severity", event.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(SEVERITY_CONFIG).map(([id, value]) => (
                  <option key={id} value={id}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Button
            className="mt-3 min-h-11"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setMessage("");
            }}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Limpiar filtros
          </Button>
        </fieldset>
      </fieldset>
      <section aria-labelledby="preview-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="preview-heading" className="text-body font-semibold">
            3 Vista previa y exportacion
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" disabled={disabled} onClick={() => void exportFile("xlsx")}>
              <Download size={16} aria-hidden="true" />
              {exporting === "xlsx" ? "Generando Excel..." : "Exportar Excel"}
            </Button>
            <Button variant="primary" className="min-h-11" disabled={disabled} onClick={() => void exportFile("pdf")}>
              <Download size={16} aria-hidden="true" />
              {exporting === "pdf" ? "Generando PDF..." : "Exportar PDF"}
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-red">
            {error}
          </p>
        )}
        <p role="status" className="text-body-sm text-muted">
          {message || `${report.rows.length} de ${rows.length} registros coinciden con tus filtros`}
        </p>
        <h3 className="text-body font-medium">{report.title}</h3>
        <div className="grid gap-3 desktop:grid-cols-4">
          {report.indicators.map((item) => (
            <div key={item.label} className="rounded border border-line bg-surface p-4">
              <div className="text-body-sm text-muted">{item.label}</div>
              <div className="mt-2 text-heading font-semibold">
                {item.value.toFixed(item.percent ? 1 : 0)}
                {item.percent ? "%" : ""}
              </div>
            </div>
          ))}
        </div>
        {!report.rows.length ? (
          <p className="rounded border border-line p-6 text-body-sm">
            No hay hallazgos con estos filtros Cambia o limpia los filtros para continuar
          </p>
        ) : (
          fields.length > 0 && (
            <div className="overflow-x-auto">
              <DataTable
                columns={report.fields.map((field, index) => ({
                  id: field.id,
                  header: field.label,
                  render: (row: { values: (string | number | null)[] }) => row.values[index] ?? "Sin dato",
                }))}
                rows={report.rows.map((values, index) => ({ index, values }))}
                getRowKey={(row) => row.index}
              />
            </div>
          )
        )}
      </section>
    </div>
  );
}
