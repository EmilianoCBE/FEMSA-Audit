// Fase 1 del workflow: cada formulario guarda su flujo (y entra en la siguiente versión).
describe("Workflow guardado por formulario", () => {
  const layout = (id: string, name: string, workflow: unknown = null) => ({
    id,
    name,
    elements: [],
    workflow,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  const savedWorkflow = {
    size: { width: 600, height: 200 },
    states: [
      { id: "borrador", kind: "Inicial", name: "Borrador", tone: "neutral", position: { x: 22, y: 20 } },
      { id: "cerrado", kind: "Final", name: "Cerrado", tone: "green", position: { x: 300, y: 20 } },
    ],
    transitions: [
      {
        id: "cerrar",
        label: "cerrar directo",
        from: "borrador",
        to: "cerrado",
        role: "Jefe de Auditoría",
        variant: "default",
      },
    ],
    suggestedStates: [],
    annotations: [],
  };

  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/ai/status", { aiAvailable: true, reason: null, retryAt: null, provider: "mock" });
  });

  it("un formulario sin flujo muestra la plantilla base y se puede guardar tal cual", () => {
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout("layout dummy", "Modulo de hallazgos")] });
    cy.intercept("PUT", "/api/designer/layouts/*/workflow", (request) =>
      request.reply({ layout: layout("layout dummy", "Modulo de hallazgos", request.body.workflow) }),
    ).as("guardar");
    cy.visit("/app-builder/workflow/flow");
    cy.contains("[role=status]", "Plantilla base: aún no se guarda");
    cy.contains("button", "Guardar flujo").click();
    cy.wait("@guardar").then(({ request }) => {
      expect(request.url).to.match(/\/designer\/layouts\/layout%20dummy\/workflow$/);
      expect(request.body.workflow.states).to.have.length(6);
      expect(request.body.workflow).not.to.have.property("warnings");
    });
    cy.contains("Flujo guardado. Se incluirá en la siguiente versión del formulario.");
    cy.contains("[role=status]", "Guardado");
    cy.contains("button", "Guardar flujo").should("be.disabled");
  });

  it("carga el flujo guardado de cada formulario", () => {
    cy.intercept("GET", "/api/designer/layouts", {
      layouts: [layout("layout dummy", "Modulo de hallazgos"), layout("otro", "Formulario de visitas", savedWorkflow)],
    });
    cy.visit("/app-builder/workflow/flow");
    cy.contains("text", "enviar");
    cy.get("select").first().select("Formulario de visitas");
    cy.contains("text", "cerrar directo");
    cy.contains("text", "enviar").should("not.exist");
    cy.contains("[role=status]", "Guardado");
  });

  it("aceptar una sugerencia deja cambios sin guardar; descartar regresa a lo guardado", () => {
    const withoutRole = {
      ...savedWorkflow,
      transitions: [{ ...savedWorkflow.transitions[0], role: null }],
    };
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout("otro", "Formulario de visitas", withoutRole)] });
    cy.visit("/app-builder/workflow/flow");
    cy.contains("[role=status]", "Guardado");
    cy.contains("button", "Revisar").click();
    cy.contains("li", "«cerrar directo» no tiene rol asignado").contains("button", "Aceptar").click();
    cy.contains("[role=status]", "Cambios sin guardar");
    cy.get("select").first().should("be.disabled");

    cy.contains("button", "Descartar cambios").click();
    cy.contains("[role=status]", "Guardado");
    cy.get("select").first().should("be.enabled");
  });

  it("si no se puede guardar lo dice, y un rol de solo lectura no ve los botones", () => {
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout("layout dummy", "Modulo de hallazgos")] });
    cy.intercept("PUT", "/api/designer/layouts/*/workflow", {
      statusCode: 400,
      body: { message: "El flujo no es válido: prueba" },
    });
    cy.visit("/app-builder/workflow/flow");
    cy.contains("button", "Guardar flujo").click();
    cy.get("[role=alert]").should("contain", "El flujo no es válido: prueba");

    cy.intercept("GET", "/api/permissions/me", {
      permissions: { "app-builder": "read", risks: "read", reports: "read" },
      canManagePermissions: false,
    });
    cy.visit("/app-builder/workflow/flow");
    cy.contains("Solo lectura: tu rol no puede modificar el flujo.");
    cy.contains("button", "Guardar flujo").should("not.exist");
  });
});
