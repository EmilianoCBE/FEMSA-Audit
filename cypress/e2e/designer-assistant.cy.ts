describe("Asistente de diseño del Designer (US15-US17)", () => {
  const field = (id: string, type: string, label: string, section: string) => ({
    id,
    type,
    x: 0,
    y: 0,
    width: 520,
    height: 56,
    config: { label, section },
  });
  const layout = {
    id: "layout dummy",
    name: "Modulo de hallazgos",
    elements: [
      field("titulo", "short-text", "Título del hallazgo", "identificacion"),
      field("f1", "short-text", "Fecha compromiso", "remediacion"),
      field("t1", "short-text", "Texto corto", "evaluacion"),
    ],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const analysis = {
    appId: "layout dummy",
    aiAvailable: true,
    recorded: true,
    provider: "mock",
    promptVersion: "mock-v1",
    latencyMs: 3,
    suggestions: [
      {
        id: "rules-1",
        source: "rules",
        kind: "inconsistency",
        title: "El campo «Texto corto» no tiene un nombre descriptivo",
        reason: "La etiqueta es la que viene por defecto al arrastrar el componente.",
        confidence: "alta",
        fieldId: "t1",
      },
      {
        id: "rules-2",
        source: "rules",
        kind: "component",
        title: "Usar el componente Fecha para «Fecha compromiso»",
        reason: "La etiqueta indica que el dato es de tipo fecha.",
        confidence: "media",
        fieldId: "f1",
        change: { op: "change-field-type", fieldId: "f1", type: "date" },
      },
      {
        id: "ai-1",
        source: "ai",
        kind: "field",
        title: "Agregar la fecha de detección del hallazgo",
        reason: "Sin una fecha de detección no se puede medir el tiempo de atención.",
        confidence: "media",
        change: { op: "add-field", type: "date", label: "Fecha de detección", section: "identificacion" },
      },
    ],
  };

  const card = (title: string) => cy.get(`li[aria-label="${title}"]`);
  const openAssistant = () => cy.contains("[role=radio]", "Asistente IA").click();

  it("muestra el tipo original antes de aceptar", () => {
    cy.contains("button", "Fecha compromiso").children().last().should("have.text", "Texto");
  });

  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout] });
    cy.intercept("PUT", "/api/designer/layouts/*/canvas", cy.spy().as("guardarLienzo"));
    cy.visit("/app-builder/designer/fields");
    cy.contains("Fecha compromiso");
  });

  it("US17 aceptar aplica el cambio en pantalla sin guardarlo; rechazar no cambia nada", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", analysis).as("analizar");
    openAssistant();
    cy.contains("button", "Analizar formulario").click();
    cy.wait("@analizar").its("request.body").should("deep.equal", { appId: "layout dummy" });

    card(analysis.suggestions[1].title).within(() => {
      cy.contains("Por qué: La etiqueta indica");
      cy.contains("Cambio propuesto: Cambiar «Fecha compromiso» a Fecha");
      cy.contains("button", "Aceptar").click();
      cy.contains("Aceptada");
    });
    // La etiqueta de tipo del campo pasa de "Texto" a "Fecha".
    cy.contains("button", "Fecha compromiso").children().last().should("have.text", "Fecha");

    card(analysis.suggestions[2].title).within(() => {
      cy.contains("button", "Rechazar").click();
      cy.contains("Rechazada: no se cambió nada.");
    });
    cy.contains("button", "Fecha de detección").should("not.exist");

    // Nada se guardó solo: el usuario decide cuándo guardar.
    cy.get("@guardarLienzo").should("not.have.been.called");
    cy.contains("3 sugerencias · 1 pendientes");
  });

  it("US17 reemplazar aplica la versión editada por el usuario e 'Ir al campo' lo selecciona", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", analysis);
    openAssistant();
    cy.contains("button", "Analizar formulario").click();

    card(analysis.suggestions[2].title).within(() => {
      cy.contains("button", "Reemplazar").click();
      cy.get("input").clear().type("Fecha en que se detectó");
      cy.contains("button", "Aplicar mi versión").click();
      cy.contains("Reemplazada");
    });
    cy.contains("button", "Fecha en que se detectó");

    openAssistant();
    card(analysis.suggestions[0].title).within(() => cy.contains("button", "Ir al campo").click());
    cy.contains("Campo seleccionado").parent().should("contain", "Texto corto");
  });

  it("US18 si la IA no está disponible muestra solo las reglas y lo avisa", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", {
      ...analysis,
      aiAvailable: false,
      suggestions: analysis.suggestions.filter((s) => s.source === "rules"),
    });
    openAssistant();
    cy.contains("button", "Analizar formulario").click();
    cy.contains("La IA no está disponible. Se muestran solo las revisiones automáticas.");
    cy.contains("2 sugerencias");
  });

  it("US18 si el asistente falla, el Designer sigue funcionando de forma manual", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", { statusCode: 500, body: { msg: "Error" } });
    openAssistant();
    cy.contains("button", "Analizar formulario").click();
    cy.get("[role=alert]").should("contain", "Puedes seguir editando el formulario manualmente");

    cy.contains("[role=radio]", "Campo").click();
    cy.contains("button", "+ Agregar campo").first().click();
    cy.contains("button", "Descartar").should("be.enabled");
  });

  it("pide guardar antes de analizar si hay cambios sin guardar", () => {
    cy.contains("button", "+ Agregar campo").first().click();
    openAssistant();
    cy.contains("button", "Analizar formulario").should("be.disabled");
    cy.contains("Guarda los cambios del formulario para analizar lo que ves.");
  });

  it("US17 cada decisión queda registrada en el historial del asistente", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", analysis);
    cy.intercept("POST", "/api/ai/recommendations/*/decision", { recommendation: {} }).as("decision");
    openAssistant();
    cy.contains("button", "Analizar formulario").click();

    card(analysis.suggestions[1].title).within(() => cy.contains("button", "Aceptar").click());
    cy.wait("@decision").then(({ request }) => {
      expect(request.url).to.match(/\/recommendations\/rules-2\/decision$/);
      expect(request.body).to.deep.equal({ decision: "accepted" });
    });

    card(analysis.suggestions[2].title).within(() => {
      cy.contains("button", "Reemplazar").click();
      cy.get("input").clear().type("Fecha de hallazgo");
      cy.contains("button", "Aplicar mi versión").click();
    });
    cy.wait("@decision")
      .its("request.body")
      .should("deep.equal", {
        decision: "replaced",
        change: { op: "add-field", type: "date", label: "Fecha de hallazgo", section: "identificacion" },
      });

    card(analysis.suggestions[0].title).within(() => cy.contains("button", "Rechazar").click());
    cy.wait("@decision").its("request.body").should("deep.equal", { decision: "rejected" });
  });

  it("si no se pudo registrar la decisión, avisa sin deshacer el cambio", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", analysis);
    cy.intercept("POST", "/api/ai/recommendations/*/decision", { statusCode: 500, body: { msg: "Error" } });
    openAssistant();
    cy.contains("button", "Analizar formulario").click();
    card(analysis.suggestions[1].title).within(() => cy.contains("button", "Aceptar").click());
    cy.contains("No se pudo registrar alguna decisión");
    cy.contains("button", "Fecha compromiso").children().last().should("have.text", "Fecha");
  });

  it("si el análisis no se guardó (recorded false), no intenta registrar decisiones", () => {
    cy.intercept("POST", "/api/ai/designer/analyze", { ...analysis, recorded: false });
    cy.intercept("POST", "/api/ai/recommendations/*/decision", cy.spy().as("registro"));
    openAssistant();
    cy.contains("button", "Analizar formulario").click();
    card(analysis.suggestions[2].title).within(() => {
      cy.contains("button", "Rechazar").click();
      cy.contains("Rechazada");
    });
    cy.get("@registro").should("not.have.been.called");
  });
});
