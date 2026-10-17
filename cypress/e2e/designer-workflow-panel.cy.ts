describe("Flujo del proceso en el Designer (US05)", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
  });

  it("se expande y se minimiza sin salir del Designer", () => {
    cy.visit("/app-builder/designer/history");

    cy.contains("Flujo del proceso");
    cy.contains("Borrador → En revisión");

    cy.get("button[aria-label='Expandir flujo del proceso']").click();
    cy.get("[role=img][aria-label^='Diagrama del flujo']").should("be.visible");
    cy.contains("Desvíos (2)").should("be.visible");
    cy.contains("Reglas (3)").should("be.visible");
    cy.contains("Evidencia requerida").should("be.visible");

    cy.get("button[aria-label='Minimizar flujo del proceso']").click();
    cy.contains("Reglas (3)").should("not.be.visible");
    cy.location("pathname").should("eq", "/app-builder/designer/history");
  });

  it("al bajar muestra la miniatura y abre el flujo en grande", () => {
    // Pantalla baja para que el panel salga de la vista al hacer scroll
    cy.viewport(1000, 360);
    cy.visit("/app-builder/designer/history");

    cy.get("button[aria-label='Ver flujo del proceso en grande']").should("not.exist");
    cy.scrollTo("bottom");
    cy.get("button[aria-label='Ver flujo del proceso en grande']").click();

    cy.get("dialog[aria-label='Flujo del proceso']").should("be.visible").and("contain", "Reglas (3)");
    cy.get("button[aria-label='Cerrar flujo del proceso']").click();
    cy.get("dialog[aria-label='Flujo del proceso']").should("not.be.visible");
    cy.location("pathname").should("eq", "/app-builder/designer/history");
  });
});
