import { SOURCE_NOTICE, type ReportSnapshot } from "./reportModel";

export async function createExcel(report: ReportSnapshot): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FEMSA GRC";
  workbook.created = report.generatedAt;
  const info = workbook.addWorksheet("Reporte");
  info.columns = [{ width: 46 }, { width: 90 }];
  info.addRows([
    [report.title],
    [SOURCE_NOTICE],
    ["Generado", report.generatedAt],
    ["Filtros", report.filters],
    ["Registros", report.rows.length],
    ["Calculo", "Indicadores sobre los registros filtrados"],
    ["Porcentaje de cierre", "Hallazgos cerrados / total de hallazgos filtrados"],
    [],
    ["Indicador", "Valor"],
  ]);
  info.getCell("B3").numFmt = "yyyy-mm-dd hh:mm";
  for (const indicator of report.indicators) {
    const row = info.addRow([indicator.label, indicator.percent ? indicator.value / 100 : indicator.value]);
    if (indicator.percent) row.getCell(2).numFmt = "0.0%";
  }
  const detail = workbook.addWorksheet("Hallazgos", { views: [{ state: "frozen", ySplit: 1 }] });
  detail.columns = report.fields.map((field) => ({
    header: field.label,
    key: field.id,
    width: field.id === "title" ? 65 : 30,
  }));
  // Guardamos texto como texto para que no se convierta en formulas
  for (const values of report.rows) detail.addRow(values);
  detail.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: report.rows.length + 1, column: report.fields.length },
  };
  for (const sheet of [info, detail]) {
    sheet.eachRow((row) => {
      row.alignment = { vertical: "top", wrapText: true };
    });
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF233D4D" } };
  }
  const data = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(data)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function createPdf(report: ReportSnapshot): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const titleLines = doc.splitTextToSize(report.title, width - 28);
  doc.setFontSize(15);
  doc.text(titleLines, 14, 16);
  let y = 19 + titleLines.length * 6;
  doc.setFontSize(9);
  // El aviso tambien va en los archivos para no confundir los datos
  const metadata = [
    SOURCE_NOTICE.replace("—", "-"),
    `Generado: ${report.generatedAt.toLocaleString("es-MX")}`,
    report.filters,
    `${report.rows.length} registros | Indicadores sobre los registros filtrados`,
  ];
  for (const line of metadata) {
    const lines = doc.splitTextToSize(line, width - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 2;
  }
  if (report.indicators.length) {
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: report.indicators.map((item) => [
        item.label,
        `${item.value.toFixed(item.percent ? 1 : 0)}${item.percent ? "%" : ""}`,
      ]),
      styles: { fontSize: 9 },
      margin: { bottom: 16 },
    });
    y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }
  autoTable(doc, {
    startY: y,
    head: [report.fields.map((field) => field.label)],
    body: report.rows.map((row) => row.map((value) => value ?? "Sin dato")),
    styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
    margin: { top: 14, bottom: 16 },
    rowPageBreak: "avoid",
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(`FEMSA GRC | Datos de ejemplo | Pagina ${page} de ${pages}`, 14, doc.internal.pageSize.getHeight() - 7);
  }
  return doc.output("blob");
}

export function downloadReport(blob: Blob, format: "xlsx" | "pdf") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-grc-ejemplo-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
