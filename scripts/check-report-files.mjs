import ExcelJS from "exceljs";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Revisamos que los archivos descargados tengan los datos de la respuesta guardada
const samples = JSON.parse(await readFile("evidencia/reportes/datos-exportacion.json", "utf8"));
const results = [];
for (const data of samples) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(`evidencia/reportes/archivos/bd-${data.kind}.xlsx`);
  const detail = workbook.getWorksheet("Detalle");
  assert.ok(detail);
  assert.equal(detail.rowCount - 1, data.rows.length);
  for (let index = 0; index < data.rows.length; index++) {
    for (let column = 0; column < data.fields.length; column++) {
      const field = data.fields[column];
      const expected = data.rows[index][field.id];
      const actual = detail.getCell(index + 2, column + 1).value;
      if (field.type === "date" && expected !== null) assert.equal(actual.toISOString(), expected);
      else assert.equal(actual, expected);
    }
  }
  assert.ok(workbook.getWorksheet("Reporte").getCell("A2").text.includes("E12_FEMSA"));
  results.push({
    kind: data.kind,
    rows: data.rows.length,
    fields: data.fields.length,
    result: "APROBADO",
    check: "Todas las celdas coinciden incluyendo tipos de fecha y numero",
  });
}
await writeFile("evidencia/reportes/verificacion-excel.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
