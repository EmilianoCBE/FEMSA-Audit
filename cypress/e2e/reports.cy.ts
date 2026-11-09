describe("Reportes y exportacion", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.visit("/reportes/ejecutivos");
  });

  it("filtra y mantiene la seleccion de columnas", () => {
    cy.contains("4 de 4 registros");
    cy.get('input[placeholder="Folio hallazgo o auditoria"]').type("SAP");
    cy.contains("1 de 4 registros");
    cy.contains("label", "Auditoria").find('input[type="checkbox"]').uncheck();
    cy.get("thead").should("not.contain", "Auditoria");
    cy.contains("button", "Limpiar filtros").click();
    cy.contains("4 de 4 registros");
    cy.get('input[placeholder="Folio hallazgo o auditoria"]').type("sin coincidencias");
    cy.contains("No hay hallazgos con estos filtros");
    cy.contains("button", "Exportar Excel").should("be.disabled");
  });

  it("descarga Excel y PDF y exige al menos una columna", () => {
    cy.contains("button", "Exportar Excel").click();
    cy.contains("Archivo Excel generado con 4 registros");
    cy.contains("button", "Exportar PDF").click();
    cy.contains("Archivo PDF generado con 4 registros");
    cy.readFile(`cypress/downloads/reporte-grc-ejemplo-${new Date().toISOString().slice(0, 10)}.xlsx`, null).should(
      "have.length.greaterThan",
      1000,
    );
    cy.readFile(`cypress/downloads/reporte-grc-ejemplo-${new Date().toISOString().slice(0, 10)}.pdf`, null).should(
      "have.length.greaterThan",
      1000,
    );
    cy.contains("fieldset", "Columnas del archivo").find('input[type="checkbox"]').uncheck();
    cy.contains("Selecciona al menos una columna");
    cy.contains("button", "Exportar PDF").should("be.disabled");
    cy.viewport(390, 844);
    cy.contains("h1", "Reportes").should("be.visible");
    cy.screenshot("reportes-movil");
  });
});
