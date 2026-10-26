// Estas pruebas usan respuestas controladas y no se conectan a Azure
const field = (id: string, label: string) => ({ id, label });
function response(kind: string, filters: Record<string, string>) {
  const items = [
    {
      recordId: 1,
      id: "REP-01",
      title: "Seguimiento TI",
      auditName: "Auditoria TI",
      businessUnit: "Unidad A",
      status: "abierto",
      severity: "Alta",
      amount: 1500,
    },
    {
      recordId: 2,
      id: "REP-02",
      title: "Revision de controles",
      auditName: "Auditoria financiera",
      businessUnit: "Unidad B",
      status: "cerrado",
      severity: "Baja",
      amount: 0,
    },
  ];
  const rows = items.filter(
    (row) =>
      (!filters.search || row.title.includes(filters.search)) && (!filters.status || row.status === filters.status),
  );
  return {
    kind,
    fields: [
      field("id", "Folio"),
      field("title", "Descripcion"),
      field("auditName", "Auditoria"),
      field("status", "Estado"),
      { id: "amount", label: "Monto MXN", type: "number" },
    ],
    rows,
    filters,
    indicators: [{ id: "total", label: "Total de registros", value: rows.length, percent: false }],
    source: "Respuesta controlada para testing",
    scope: "Prueba de interfaz",
    queriedAt: new Date().toISOString(),
  };
}
describe("Reportes API y exportacion", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/reports*", (req) => {
      const url = new URL(req.url);
      const filters = Object.fromEntries(
        ["search", "businessUnit", "status", "severity", "start", "end"].map((key) => [
          key,
          url.searchParams.get(key) || "",
        ]),
      );
      req.reply(response(url.searchParams.get("kind") || "findings", filters));
    }).as("reports");
    cy.visit("/reportes/ejecutivos");
    cy.wait("@reports");
  });
  it("REP-14 aplica filtros en la API y bloquea descargas pendientes", () => {
    cy.contains("2 registros coinciden");
    cy.contains("label", "Buscar folio").find("input").type("Seguimiento");
    cy.contains("button", "Exportar Excel").should("be.disabled");
    cy.contains("button", "Aplicar filtros").click();
    cy.wait("@reports").its("request.query.search").should("eq", "Seguimiento");
    cy.contains("1 registros coinciden");
    cy.screenshot("REP-14-filtros-api");
    cy.contains("button", "Limpiar filtros").click();
    cy.wait("@reports");
    cy.contains("2 registros coinciden");
  });
  for (const [kind, label] of [
    ["audits", "Auditorias"],
    ["findings", "Hallazgos"],
    ["plans", "Planes de accion"],
  ]) {
    it(`REP-15 exporta ${label} a Excel y PDF`, () => {
      if (kind !== "findings") {
        cy.get('select[aria-label="Contenido"]').select(kind);
        cy.wait("@reports");
      }
      cy.contains("2 registros coinciden");
      cy.screenshot(`REP-15-${kind}-vista`);
      cy.contains("button", "Exportar Excel").click();
      cy.contains("Archivo Excel generado con 2 registros");
      cy.contains("button", "Exportar PDF").click();
      cy.contains("Archivo PDF generado con 2 registros");
      for (const format of ["xlsx", "pdf"])
        cy.readFile(
          `cypress/downloads/reporte-grc-${kind}-${new Date().toISOString().slice(0, 10)}.${format}`,
          null,
        ).should("have.length.greaterThan", 1000);
    });
  }
  it("REP-16 muestra vacios sin exportar y exige columnas", () => {
    cy.contains("fieldset", "Columnas del archivo").find('input[type="checkbox"]').uncheck();
    cy.contains("Selecciona al menos una columna");
    cy.contains("button", "Exportar PDF").should("be.disabled");
    cy.screenshot("REP-16-sin-columnas");
    cy.contains("label", "Buscar folio").find("input").type("sin coincidencias");
    cy.contains("button", "Aplicar filtros").click();
    cy.wait("@reports");
    cy.contains("No hay registros con estos filtros");
    cy.screenshot("REP-16-sin-resultados");
  });
  it("REP-17 muestra error de API sin reemplazarlo con ejemplos", () => {
    cy.intercept("GET", "/api/reports*", { statusCode: 503, body: { msg: "Base no disponible" } }).as("failed");
    cy.get('select[aria-label="Contenido"]').select("audits");
    cy.wait("@failed");
    cy.contains("Base no disponible");
    cy.contains("button", "Exportar PDF").should("not.exist");
    cy.screenshot("REP-17-error-bd");
  });
  it("REP-18 permite configurar el reporte en movil", () => {
    cy.viewport(390, 844);
    cy.contains("h1", "Reportes").should("be.visible");
    cy.get('input[name="report-title"]').should("have.attr", "autocomplete", "off");
    cy.screenshot("REP-18-movil");
  });
});
