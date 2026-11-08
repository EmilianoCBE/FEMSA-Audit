describe("Asistente de diseño del workflow (US16-US18)", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.visit("/app-builder/workflow/flow");
  });

  const openAssistant = () => {
    cy.contains("El asistente detectó 2 inconsistencias");
    cy.contains("button", "Revisar").click();
  };

  it("US16 marca las inconsistencias en el diagrama y explica cada una", () => {
    cy.get("[role=img][aria-label$='no tiene rol asignado']").should("have.length", 2);
    openAssistant();
    cy.get("[aria-label='Asistente de diseño del flujo'] li").should("have.length", 2);
    cy.get("li[aria-label='«cerrar» no tiene rol asignado']")
      .should("contain", "Por qué:")
      .and("contain", "Cambio propuesto: asignar el rol «Dirección de Auditoría» a «cerrar»");
  });

  it("US18 avisa que la IA no está disponible y el flujo sigue editable con las reglas", () => {
    openAssistant();
    cy.contains("[role=status]", "La IA no está disponible para el flujo");
    cy.get("li[aria-label='«cerrar» no tiene rol asignado']").contains("button", "Aceptar").should("be.enabled");
  });

  it("US17 aceptar aplica el cambio; rechazar no cambia nada", () => {
    openAssistant();
    cy.get("li[aria-label='«cerrar» no tiene rol asignado']").within(() => {
      cy.contains("button", "Aceptar").click();
      cy.contains("Aceptada: se aplicó al flujo.");
    });
    cy.contains("El asistente detectó 1 inconsistencia en este flujo.");
    cy.get("[role=img][aria-label='«cerrar» no tiene rol asignado']").should("not.exist");

    cy.get("li[aria-label='«devolver a revisión» no tiene rol asignado']").within(() => {
      cy.contains("button", "Rechazar").click();
      cy.contains("Rechazada: no se cambió nada.");
    });
    cy.contains("El asistente detectó 1 inconsistencia en este flujo.");
    cy.get("[role=img][aria-label='«devolver a revisión» no tiene rol asignado']").should("exist");
  });

  it("US17 reemplazar aplica la versión del usuario y 'Volver a analizar' confirma que ya no hay inconsistencias", () => {
    openAssistant();
    cy.get("li[aria-label='«cerrar» no tiene rol asignado']").contains("button", "Aceptar").click();
    cy.get("li[aria-label='«devolver a revisión» no tiene rol asignado']").within(() => {
      cy.contains("button", "Reemplazar").click();
      cy.get("select").select("Auditor");
      cy.contains("button", "Aplicar mi versión").click();
      cy.contains("Reemplazada: se aplicó tu versión.");
    });
    cy.contains("El asistente no encontró inconsistencias en este flujo.");
    cy.contains("button", "Volver a analizar").click();
    cy.contains("No se encontraron inconsistencias en este flujo.");
  });
});
