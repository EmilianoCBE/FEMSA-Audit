import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import type { Finding } from "@/features/inbox/types";
import { buildSnapshot, EMPTY_FILTERS, FIELDS, filterFindings } from "./reportModel";
import { createExcel, createPdf } from "./reportExport";

const rows: Finding[] = [
  {
    id: "H1",
    title: "=SUM(A1:A9)",
    businessUnit: "Unidad A",
    auditName: "TI",
    status: "in-review",
    severity: "high",
    waitingDays: 10,
  },
  {
    id: "H2",
    title: "Cerrado",
    businessUnit: "Unidad B",
    auditName: "Finanzas",
    status: "closed",
    severity: "low",
    waitingDays: null,
  },
];

describe("reportes GRC", () => {
  it("combina filtros sin cambiar la fuente", () => {
    expect(filterFindings(rows, { ...EMPTY_FILTERS, businessUnit: "Unidad A", status: "closed" })).toEqual([]);
    expect(filterFindings(rows, { ...EMPTY_FILTERS, search: "ti", severity: "high" }).map((row) => row.id)).toEqual([
      "H1",
    ]);
    expect(rows).toHaveLength(2);
  });
  it("calcula indicadores sobre la seleccion y maneja una seleccion vacia", () => {
    const report = buildSnapshot(rows, ["id"], ["total", "open", "high", "closedPercent"], EMPTY_FILTERS, "");
    expect(report.indicators.map((item) => item.value)).toEqual([2, 1, 1, 50]);
    expect(report.rows).toEqual([["H1"], ["H2"]]);
    const empty = buildSnapshot(rows, ["id"], ["closedPercent"], { ...EMPTY_FILTERS, search: "sin coincidencias" }, "");
    expect(empty.indicators[0].value).toBe(0);
  });
  it("genera Excel con valores numericos y texto que no se ejecuta como formula", async () => {
    const report = buildSnapshot(rows, ["title", "waitingDays"], ["closedPercent"], EMPTY_FILTERS, "Seguimiento");
    const blob = await createExcel(report);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await blob.arrayBuffer());
    const detail = book.getWorksheet("Hallazgos");
    if (!detail) throw new Error("Falta la hoja de hallazgos");
    expect(detail.getRow(1).values).toEqual([undefined, "Hallazgo", "Dias en espera"]);
    expect(detail.getCell("A2").value).toBe("=SUM(A1:A9)");
    expect(detail.getCell("B2").value).toBe(10);
    expect(detail.getCell("B3").value).toBeNull();
    expect(book.getWorksheet("Reporte")?.getCell("B10").value).toBe(0.5);
    expect(book.getWorksheet("Reporte")?.getCell("A2").text).toContain("Datos de ejemplo");
  });
  it("genera PDF paginado con todas las columnas y textos largos", async () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      ...rows[0],
      id: `H${i}`,
      title: "Descripcion extensa del hallazgo para comprobar los saltos de linea y el seguimiento ".repeat(3),
    }));
    const report = buildSnapshot(
      many,
      FIELDS.map((field) => field.id),
      ["total"],
      EMPTY_FILTERS,
      "Seguimiento",
    );
    const blob = await createPdf(report);
    const text = new TextDecoder().decode(await blob.arrayBuffer());
    expect(text.startsWith("%PDF-")).toBe(true);
    expect((text.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
    expect(text).toContain("H99");
    expect(text).toContain("Datos de ejemplo");
  });
});
