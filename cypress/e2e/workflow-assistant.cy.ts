describe("Asistente de diseño del workflow (US16-US18)", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.visit("/app-builder/workflow/flow");
  });

  const card = (title: string) => {
    cy.get(`li[aria-label="${title}"] > button[aria-expanded]`).then(($button) => {
      if ($button.attr("aria-expanded") === "false") cy.wrap($button).click();
    });
    return cy.get(`li[aria-label="${title}"]`);
  };
  const lastDecision = () => cy.get("[aria-label='Última decisión']");

  const openAssistant = () => {
    cy.contains("El asistente detectó 2 inconsistencias");
    cy.contains("button", "Revisar").click();
  };

  it("US16 marca las inconsistencias en el diagrama y explica cada una", () => {
    cy.get("[role=img][aria-label$='no tiene rol asignado']").should("have.length", 2);
    openAssistant();
    cy.get("[aria-label='Asistente de diseño del flujo'] li").should("have.length", 2);
    card("«cerrar» no tiene rol asignado")
      .should("contain", "Por qué:")
      .and("contain", "Cambio propuesto: asignar el rol «Dirección de Auditoría» a «cerrar»");
  });

  it("US18 avisa que la IA no está disponible y el flujo sigue editable con las reglas", () => {
    openAssistant();
    cy.contains("[role=status]", "La IA no está disponible para el flujo");
    card("«cerrar» no tiene rol asignado").contains("button", "Aceptar").should("be.enabled");
  });

  it("US17 aceptar aplica el cambio; rechazar no cambia nada", () => {
    openAssistant();
    card("«cerrar» no tiene rol asignado").within(() => cy.contains("button", "Aceptar").click());
    lastDecision().should("contain", "Aceptada: se aplicó al flujo.");
    cy.contains("El asistente detectó 1 inconsistencia en este flujo.");
    cy.get("[role=img][aria-label='«cerrar» no tiene rol asignado']").should("not.exist");

    card("«devolver a revisión» no tiene rol asignado").within(() => cy.contains("button", "Rechazar").click());
    lastDecision().should("contain", "Rechazada: no se cambió nada.");
    cy.contains("2 de 2 revisadas");
    cy.contains("El asistente detectó 1 inconsistencia en este flujo.");
    cy.get("[role=img][aria-label='«devolver a revisión» no tiene rol asignado']").should("exist");
  });

  it("US17 reemplazar aplica la versión del usuario y 'Volver a analizar' confirma que ya no hay inconsistencias", () => {
    openAssistant();
    card("«cerrar» no tiene rol asignado").contains("button", "Aceptar").click();
    card("«devolver a revisión» no tiene rol asignado").within(() => {
      cy.contains("button", "Reemplazar").click();
      cy.get("select").select("Auditor");
      cy.contains("button", "Aplicar mi versión").click();
    });
    lastDecision().should("contain", "Reemplazada: se aplicó tu versión.");
    cy.contains("El asistente no encontró inconsistencias en este flujo.");
    cy.contains("button", "Volver a analizar").click();
    cy.contains("No se encontraron inconsistencias en este flujo.");
  });
});
