import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildSnapshot, displayValue, EMPTY_FILTERS, type ReportData } from "./reportModel";
import { createExcel, createPdf } from "./reportExport";

const data: ReportData = {
  kind: "findings",
  fields: [
    { id: "id", label: "Folio" },
    { id: "title", label: "Descripcion" },
    { id: "amount", label: "Impacto MXN", type: "number" },
    { id: "date", label: "Fecha", type: "date" },
  ],
  rows: [
    { recordId: 1, id: "H1", title: "=SUM(A1:A9)", amount: 123.45, date: "2026-10-01T00:00:00.000Z" },
    { recordId: 2, id: "H2", title: "Otro hallazgo", amount: null, date: null },
  ],
  filters: EMPTY_FILTERS,
  indicators: [
    { id: "total", label: "Total", value: 2, percent: false },
    { id: "closedPercent", label: "Porcentaje de cierre", value: 50, percent: true },
  ],
  source: "E12_FEMSA | FINDING + AUDIT",
  scope: "Datos controlados de prueba",
  queriedAt: "2026-10-25T12:00:00Z",
};
describe("Reportes con API", () => {
  it("REP-10 exporta exactamente las columnas y los indicadores seleccionados", () => {
    const report = buildSnapshot(data, ["id", "amount"], ["total"], "Seguimiento");
    expect(report.rows).toEqual([
      ["H1", 123.45],
      ["H2", null],
    ]);
    expect(report.indicators.map((item) => item.id)).toEqual(["total"]);
    expect(report.source).toBe(data.source);
  });
  it("REP-11 conserva los filtros y no modifica la respuesta de la API", () => {
    const filtered = { ...data, filters: { ...EMPTY_FILTERS, status: "abierto" } };
    expect(buildSnapshot(filtered, ["id"], [], "").filters).toContain("Estado: abierto");
    expect(data.fields).toHaveLength(4);
    expect(displayValue(null, data.fields[0])).toBe("Sin dato");
  });
  it("REP-12 Excel conserva numeros fechas y texto sin ejecutar formulas", async () => {
    const blob = await createExcel(
      buildSnapshot(
        data,
        data.fields.map((field) => field.id),
        ["closedPercent"],
        "Seguimiento",
      ),
    );
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await blob.arrayBuffer());
    const sheet = book.getWorksheet("Detalle");
    if (!sheet) throw new Error("Falta el detalle");
    expect(sheet.getCell("B2").value).toBe("=SUM(A1:A9)");
    expect(sheet.getCell("C2").value).toBe(123.45);
    expect(sheet.getCell("D2").value).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    expect(sheet.getCell("C3").value).toBeNull();
    expect(book.getWorksheet("Reporte")?.getCell("A2").text).toContain("E12_FEMSA");
  });
  it("REP-13 PDF pagina tablas largas sin perder el ultimo registro", async () => {
    const many = {
      ...data,
      rows: Array.from({ length: 100 }, (_, i) => ({
        ...data.rows[0],
        id: `H${i}`,
        title: "Descripcion larga de seguimiento ".repeat(8),
      })),
    };
    const report = buildSnapshot(
      many,
      data.fields.map((field) => field.id),
      ["total"],
      "Seguimiento",
    );
    const blob = await createPdf(report);
    const text = new TextDecoder().decode(await blob.arrayBuffer());
    expect(text.startsWith("%PDF-")).toBe(true);
    expect((text.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    expect(text).toContain("H99");
    expect(text).toContain("E12_FEMSA");
    expect(text).not.toContain("Datos de ejemplo");
  });
});
