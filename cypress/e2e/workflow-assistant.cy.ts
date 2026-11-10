describe("Asistente de diseño del workflow (US15-US18)", () => {
  const aiRelation = {
    aiAvailable: true,
    aiUnavailableReason: null,
    aiRetryAt: null,
    provider: "mock",
    promptVersion: "workflow-v1",
    latencyMs: 4,
    suggestions: [
      {
        id: "ai-workflow-1",
        source: "ai",
        kind: "relation",
        title: "Permitir devolver a revisión desde «Validación del responsable»",
        reason: "Si quien valida encuentra un problema, hoy solo puede aprobar.",
        confidence: "media",
        target: { type: "state", id: "manager-validation" },
        change: {
          op: "add-transition",
          from: "manager-validation",
          to: "in-review",
          label: "devolver",
          role: "Jefe de Auditoría",
        },
      },
    ],
  };

  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/ai/status", { aiAvailable: true, reason: null, retryAt: null, provider: "mock" });
    cy.intercept("GET", "/api/designer/layouts", {
      layouts: [
        {
          id: "layout dummy",
          name: "Modulo de hallazgos",
          elements: [],
          workflow: null,
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
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

  it("US18 avisa si la IA no está configurada y el flujo sigue editable con las reglas", () => {
    cy.intercept("GET", "/api/ai/status", {
      aiAvailable: false,
      reason: "not-configured",
      retryAt: null,
      provider: "gemini",
    });
    openAssistant();
    cy.get("[aria-label='Estado de la IA']").should("contain", "La IA no está configurada en el servidor.");
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

  it("US15 la IA sugiere relaciones del flujo (solo con su estructura) y se aplican al aceptar", () => {
    cy.intercept("POST", "/api/ai/workflow/analyze", aiRelation).as("ia");
    openAssistant();
    cy.contains("● IA disponible");
    cy.contains("A la IA solo se envía la estructura del flujo");
    cy.contains("button", "Pedir sugerencias a la IA").click();
    cy.wait("@ia").then(({ request }) => {
      expect(Object.keys(request.body)).to.deep.equal(["states", "transitions", "known"]);
      expect(JSON.stringify(request.body)).not.to.contain("position");
      expect(request.body.known).to.have.length(2);
    });
    cy.contains("0 de 3 revisadas");
    card(aiRelation.suggestions[0].title)
      .should("contain", "Relación sugerida")
      .and("contain", "IA")
      .and("contain", "Cambio propuesto")
      .contains("button", "Aceptar")
      .click();
    lastDecision().should("contain", "Aceptada: se aplicó al flujo.");
    cy.get("svg").contains("text", "devolver").should("exist");
    cy.contains("button", "Volver a preguntar a la IA");
  });

  it("US18 si la IA del flujo falla o está en pausa, lo dice y quedan las reglas", () => {
    cy.intercept("POST", "/api/ai/workflow/analyze", {
      ...aiRelation,
      aiAvailable: false,
      aiUnavailableReason: "paused",
      suggestions: [],
    });
    openAssistant();
    cy.contains("button", "Pedir sugerencias a la IA").click();
    cy.get("[aria-label='Estado de la IA']").should("contain", "La IA falló hace poco y está en pausa.");
    cy.contains("0 de 2 revisadas");

    cy.intercept("POST", "/api/ai/workflow/analyze", { statusCode: 500, body: { msg: "Error" } });
    cy.contains("button", "Volver a preguntar a la IA").click();
    cy.get("[role=alert]").should("contain", "Puedes seguir editando el flujo manualmente.");
    card("«cerrar» no tiene rol asignado").contains("button", "Aceptar").should("be.enabled");
  });
});
