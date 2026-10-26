// La API y SQL ya se compararon con el script del backend
// Aqui reproducimos esa respuesta sin nombres para revisar archivos y pantalla
// Esta prueba no valida el inicio de sesion real contra Azure

describe("Evidencia con respuestas verificadas de E12_FEMSA", () => {
  for (const kind of ["audits", "findings", "plans"]) {
    it(`REP-19 exporta respuesta de BD ${kind}`, () => {
      cy.readFile("evidencia/reportes/datos-exportacion.json").then((samples) => {
        const data = samples.find((sample: { kind: string }) => sample.kind === kind);
        expect(data).to.exist;
        cy.intercept("GET", "/api/auth/me", { fixture: "user-admin.json" });
        cy.intercept("GET", "/api/reports*", (req) => req.reply(data)).as("report");
        cy.visit("/reportes/ejecutivos");
        cy.wait("@report");
        if (kind !== "findings") cy.get('select[aria-label="Contenido"]').select(kind);
        cy.contains(`${data.rows.length} registros coinciden`);
        cy.contains("E12_FEMSA");
        cy.screenshot(`REP-19-bd-${kind}`);
        cy.contains("button", "Exportar Excel").click();
        cy.contains(`Archivo Excel generado con ${data.rows.length} registros`);
        cy.contains("button", "Exportar PDF").click();
        cy.contains(`Archivo PDF generado con ${data.rows.length} registros`);
        for (const format of ["xlsx", "pdf"]) {
          const file = `cypress/downloads/reporte-grc-${kind}-${new Date().toISOString().slice(0, 10)}.${format}`;
          cy.readFile(file, null).should("have.length.greaterThan", 1000);
          cy.readFile(file, "base64").then((content) =>
            cy.writeFile(`evidencia/reportes/archivos/bd-${kind}.${format}`, content, "base64"),
          );
        }
      });
    });
  }
});
