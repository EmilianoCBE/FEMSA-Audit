import { useCallback, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, Page, PageHeader, QueryState } from "@/shared/ui";
import {
  buildSnapshot,
  displayValue,
  EMPTY_FILTERS,
  KINDS,
  type ReportData,
  type ReportFilters,
  type ReportKind,
} from "./reportModel";
import { reportService } from "./reportService";
import { createExcel, createPdf, downloadReport } from "./reportExport";

const inputClass =
  "min-h-11 w-full rounded border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink focus:outline-2 focus:outline-accent";

export function ReportsPage() {
  const [kind, setKind] = useState<ReportKind>("findings");
  const [draft, setDraft] = useState<ReportFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<ReportFilters>(EMPTY_FILTERS);
  const [filterError, setFilterError] = useState("");
  const fetcher = useCallback((signal: AbortSignal) => reportService.list(kind, applied, signal), [kind, applied]);
  const query = useQuery(fetcher);
  const pending = JSON.stringify(draft) !== JSON.stringify(applied);
  function apply() {
    if (draft.start && draft.end && draft.start > draft.end) {
      setFilterError("La fecha inicial no puede ser mayor a la final");
      return;
    }
    setFilterError("");
    setApplied({ ...draft });
  }
  return (
    <Page>
      <PageHeader
        title="Reportes"
        description="Selecciona informacion de auditorias hallazgos o planes y exportala a Excel o PDF"
      />
      <ContentArea>
        <div className="space-y-4">
          <label className="block max-w-md space-y-1 text-body-sm">
            Contenido
            <select
              aria-label="Contenido"
              className={inputClass}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as ReportKind);
                setDraft(EMPTY_FILTERS);
                setApplied(EMPTY_FILTERS);
                setFilterError("");
              }}
            >
              {Object.entries(KINDS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
            className="rounded border border-line bg-surface p-4"
          >
            <h2 className="mb-3 text-body font-semibold">Filtra la informacion</h2>
            <div className="grid gap-3 desktop:grid-cols-3">
              {(
                [
                  ["search", "Buscar folio descripcion o auditoria"],
                  ["businessUnit", "Unidad de negocio"],
                  ["status", "Estado"],
                  ["severity", kind === "audits" ? "Prioridad" : "Severidad"],
                  ["start", "Desde"],
                  ["end", "Hasta"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1 text-body-sm">
                  {label}
                  <input
                    className={inputClass}
                    type={key === "start" || key === "end" ? "date" : key === "search" ? "search" : "text"}
                    maxLength={key === "search" ? 150 : 200}
                    min={key === "start" || key === "end" ? "1753-01-01" : undefined}
                    max={key === "start" || key === "end" ? "9998-12-31" : undefined}
                    value={draft[key]}
                    onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-control text-muted">
              Las fechas filtran{" "}
              {kind === "audits"
                ? "el inicio de la auditoria"
                : kind === "findings"
                  ? "la identificacion del hallazgo"
                  : "el compromiso del plan"}{" "}
              Unidad estado y severidad o prioridad usan el valor completo
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit" variant="primary" className="min-h-11" disabled={query.isLoading}>
                Aplicar filtros
              </Button>
              <Button
                className="min-h-11"
                onClick={() => {
                  setDraft(EMPTY_FILTERS);
                  setApplied(EMPTY_FILTERS);
                  setFilterError("");
                }}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Limpiar filtros
              </Button>
            </div>
            {filterError && (
              <p role="alert" className="mt-2 text-body-sm text-red">
                {filterError}
              </p>
            )}
            {pending && (
              <p role="status" className="mt-2 text-body-sm text-muted">
                Aplica los filtros para actualizar la vista y habilitar las descargas
              </p>
            )}
          </form>
          {!query.error &&
          (query.isLoading ||
            (query.data &&
              (query.data.kind !== kind ||
                Object.entries(applied).some(
                  ([key, value]) => query.data?.filters[key as keyof ReportFilters] !== value,
                )))) ? (
            <p role="status">Consultando reportes...</p>
          ) : (
            <QueryState query={query}>
              {(data) => <ReportBuilder key={`${kind}-${data.queriedAt}`} data={data} pending={pending} />}
            </QueryState>
          )}
        </div>
      </ContentArea>
    </Page>
  );
}

function ReportBuilder({ data, pending }: { data: ReportData; pending: boolean }) {
  const [title, setTitle] = useState(`Reporte de ${KINDS[data.kind].toLowerCase()}`);
  const [fields, setFields] = useState(data.fields.map((field) => field.id));
  const [indicators, setIndicators] = useState(data.indicators.map((item) => item.id));
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const report = buildSnapshot(data, fields, indicators, title);
  const disabled = exporting !== null || pending || !fields.length || !report.rows.length;
  async function exportFile(format: "xlsx" | "pdf") {
    if (disabled) return;
    setExporting(format);
    setError("");
    setMessage("");
    // Copiamos la seleccion al dar clic para que el archivo coincida con la vista
    const snapshot = buildSnapshot(data, fields, indicators, title);
    try {
      downloadReport(await (format === "xlsx" ? createExcel(snapshot) : createPdf(snapshot)), format, data.kind);
      setMessage(`Archivo ${format === "xlsx" ? "Excel" : "PDF"} generado con ${snapshot.rows.length} registros`);
    } catch {
      setError("No se pudo generar el archivo Intenta de nuevo");
    } finally {
      setExporting(null);
    }
  }
  return (
    <div className="space-y-4" aria-busy={exporting !== null}>
      <p className="rounded border border-line bg-nav p-3 text-body-sm">
        Fuente {data.source}
        <br />
        Consulta {new Date(data.queriedAt).toLocaleString("es-MX")}
        <br />
        Alcance {data.scope}
      </p>
      <fieldset disabled={exporting !== null} className="space-y-4">
        <legend className="mb-3 text-body font-semibold">Configura tu reporte</legend>
        <label className="block space-y-1 text-body-sm">
          Nombre del reporte
          <input
            autoComplete="off"
            name="report-title"
            className={inputClass}
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <fieldset className="rounded border border-line bg-surface p-4">
          <legend className="px-1 text-body-sm font-semibold">Columnas del archivo</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {data.fields.map((field) => (
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
            {data.indicators.map((item) => (
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
            Indicadores sobre los registros filtrados Porcentaje de cierre = cerrados / total
          </p>
        </fieldset>
      </fieldset>
      <section aria-labelledby="preview-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="preview-heading" className="text-body font-semibold">
            Vista previa y exportacion
          </h2>
          <div className="flex flex-wrap gap-2">
            {(["xlsx", "pdf"] as const).map((format) => (
              <Button
                key={format}
                variant={format === "pdf" ? "primary" : "secondary"}
                className="min-h-11"
                disabled={disabled}
                onClick={() => void exportFile(format)}
              >
                <Download size={16} aria-hidden="true" />
                {exporting === format ? "Generando..." : `Exportar ${format === "xlsx" ? "Excel" : "PDF"}`}
              </Button>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-red">
            {error}
          </p>
        )}
        <p role="status" className="text-body-sm text-muted">
          {message || `${report.rows.length} registros coinciden con tus filtros`}
        </p>
        <h3 className="text-body font-medium">{report.title}</h3>
        <div className="grid gap-3 desktop:grid-cols-4">
          {report.indicators.map((item) => (
            <div key={item.id} className="rounded border border-line bg-surface p-4">
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
            No hay registros con estos filtros Cambia o limpia los filtros para continuar
          </p>
        ) : (
          fields.length > 0 && (
            <div className="overflow-x-auto">
              <DataTable
                columns={report.fields.map((field, index) => ({
                  id: field.id,
                  header: field.label,
                  render: (row: { values: (string | number | null)[] }) => displayValue(row.values[index], field),
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
