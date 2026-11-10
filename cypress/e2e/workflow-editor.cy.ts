// Fases 2 y 3 del workflow: edición manual del flujo, propuestas (plantilla o IA) y registro de decisiones.
describe("Editor del workflow (fases 2 y 3)", () => {
  const layout = (workflow: unknown = null) => ({
    id: "layout dummy",
    name: "Modulo de hallazgos",
    elements: [],
    workflow,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  const editor = () => cy.get("[aria-label='Editor del flujo']");
  const inspector = () => cy.get("aside");

  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/ai/status", { aiAvailable: true, reason: null, retryAt: null, provider: "mock" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout()] });
    cy.intercept("GET", "/api/ai/workflow/metrics*", {
      appId: "layout dummy",
      bySource: {
        rules: { total: 3, pending: 0, accepted: 2, rejected: 1, replaced: 0 },
        ai: { total: 0, pending: 0, accepted: 0, rejected: 0, replaced: 0 },
      },
      acceptanceRate: { rules: 0.67, ai: null },
      avgAiLatencyMs: null,
    }).as("metricas");
  });

  it("fase 2: agrega un estado y una transición; las reglas lo revisan y se puede deshacer", () => {
    cy.visit("/app-builder/workflow/flow");
    editor().within(() => {
      cy.get("form[aria-label='Agregar estado']").within(() => {
        cy.contains("button", "Agregar estado").click();
        cy.contains("Escribe el nombre del estado.");
        cy.get("input").type("Respuesta del área");
        cy.get("select").select("En proceso");
        cy.contains("button", "Agregar estado").click();
      });
    });
    // Queda seleccionado: se ve su editor y el estado en el diagrama.
    cy.get("[role=button][aria-label='Estado Respuesta del área (En proceso)']").should(
      "have.attr",
      "aria-pressed",
      "true",
    );
    inspector().contains("Estado seleccionado");
    inspector().contains("Ninguna transición llega aquí.");
    cy.contains("El asistente detectó 4 inconsistencias");

    // Conectarlo desde aquí y desde la revisión.
    inspector().contains("button", "Agregar transición desde aquí").click();
    inspector()
      .find("form[aria-label='Agregar transición']")
      .within(() => {
        cy.get("select").eq(1).select("Validación dirección");
        cy.get("input").type("responder");
        cy.contains("button", "Agregar transición").click();
      });
    inspector().contains("Sale hacia (1)");
    inspector().contains("button", "Validación dirección").click();
    inspector().contains("Llega desde (2)");
    cy.get("svg").contains("text", "responder");

    // Deshacer quita la transición; rehacer la regresa.
    cy.get("button[aria-label='Deshacer']").click();
    cy.get("svg").contains("text", "responder").should("not.exist");
    cy.get("button[aria-label='Rehacer']").click();
    cy.get("svg").contains("text", "responder");
    cy.contains("[role=status]", "Plantilla base: aún no se guarda");
  });

  it("fase 2: una transición se edita desde el diagrama (rol y requisitos) y se guarda", () => {
    cy.intercept("PUT", "/api/designer/layouts/*/workflow", (request) =>
      request.reply({ layout: layout(request.body.workflow) }),
    ).as("guardar");
    cy.visit("/app-builder/workflow/flow");
    cy.get("svg").contains("text", "cerrar").click({ force: true });
    inspector().contains("Transición seleccionada");
    inspector().contains("Validación dirección → Cerrado");
    inspector().contains("label", "Rol que puede ejecutarla").find("select").select("Auditor");
    // Segregación de funciones: el asistente lo señala.
    cy.contains("button", "Revisar").click();
    cy.contains("Editaste el flujo desde la última revisión.");
    cy.contains("button", "Volver a analizar").click();
    cy.contains("li", "«cerrar» la ejecuta Auditor").should("contain", "Segregación de funciones");
    cy.contains("li", "«cerrar» la ejecuta Auditor").find("button[aria-expanded]").click();
    cy.contains("li", "«cerrar» la ejecuta Auditor").contains("button", "Aceptar").click();

    cy.contains("button", "Configuración").click();
    cy.get("svg").contains("text", "cerrar").click({ force: true });
    inspector()
      .contains("label", "Rol que puede ejecutarla")
      .find("select")
      .should("have.value", "Dirección de Auditoría");
    inspector().contains("label", "Plan de acción").find("input").check();

    cy.contains("button", "Guardar flujo").click();
    cy.wait("@guardar").then(({ request }) => {
      const close = request.body.workflow.transitions.find((item: { id: string }) => item.id === "close");
      expect(close.role).to.equal("Dirección de Auditoría");
      expect(close.requires).to.deep.equal({ evidence: true, actionPlan: true });
    });
  });

  it("fase 2: un estado se arrastra y se mueve con el teclado; eliminarlo pide confirmación", () => {
    cy.visit("/app-builder/workflow/flow");
    const node = () => cy.get("[role=button][aria-label='Estado Cerrado (Final)']");
    // Al soltar, el estado se ajusta a la cuadrícula de 10 px.
    const snap = (value: number) => Math.round(value / 10) * 10;
    node().then(($node) => {
      const left = $node[0].offsetLeft;
      node()
        .trigger("pointerdown", { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
        .trigger("pointermove", { clientX: 160, clientY: 200, pointerId: 1 })
        .trigger("pointerup", { clientX: 160, clientY: 200, pointerId: 1 });
      node().should(($moved) => expect($moved[0].offsetLeft).to.equal(snap(left + 60)));
      cy.get("button[aria-label='Deshacer']").click();
      node().should(($back) => expect($back[0].offsetLeft).to.equal(left));
      node().click().type("{rightarrow}");
      node().should(($moved) => expect($moved[0].offsetLeft).to.equal(snap(left + 10)));
    });

    inspector().contains("button", "Eliminar estado").click();
    inspector().get("[role=alert]").should("contain", "Se eliminará «Cerrado» y 1 transición conectada.");
    inspector().contains("button", "Sí, eliminar").click();
    cy.get("[role=button][aria-label='Estado Cerrado (Final)']").should("not.exist");
    cy.contains("button", "Revisar").click();
    cy.contains("button", "Volver a analizar").click();
    cy.contains("li", "El flujo no tiene estado final");
  });

  it("fase 3: una plantilla se ve antes de aplicarla y se puede descartar o usar", () => {
    cy.visit("/app-builder/workflow/flow");
    cy.contains("button", "Revisar").click();
    cy.contains("summary", "Crear el flujo desde una descripción").click();
    cy.contains("button", "Hallazgo con plan de acción").click();
    cy.get("[aria-label='Propuesta de flujo']")
      .should("contain", "Vista previa de la plantilla")
      .and("contain", "9 estados");
    cy.contains("button", "Guardar flujo").should("be.disabled");
    cy.contains("button", "Descartar propuesta").click();
    cy.get("[role=button][aria-label='Estado Borrador (Inicial)']");
    cy.get("[aria-label='Propuesta de flujo']").should("not.exist");

    cy.contains("button", "Hallazgo con plan de acción").click();
    cy.contains("button", "Usar este flujo").click();
    cy.get("[role=button][aria-label='Estado Riesgo aceptado (Final)']");
    cy.contains("El asistente no encontró inconsistencias en este flujo.");
    cy.contains("Se aplicó la propuesta.");
    cy.get("button[aria-label='Deshacer']").click();
    cy.get("[role=button][aria-label='Estado Validación dirección (Aprobación)']");
  });

  it("fase 3 (RF-17): la IA propone un flujo desde una descripción y avisa si no está disponible", () => {
    cy.intercept("POST", "/api/ai/workflow/generate", {
      aiAvailable: true,
      aiUnavailableReason: null,
      aiRetryAt: null,
      redacted: true,
      provider: "mock",
      promptVersion: "mock-workflow-generate-v1",
      latencyMs: 12,
      workflow: {
        summary: "El auditor documenta y el jefe aprueba o devuelve.",
        states: [
          { id: "borrador", name: "Borrador", kind: "Inicial" },
          { id: "revision", name: "Revisión", kind: "Aprobación" },
          { id: "devuelto", name: "Devuelto", kind: "Retorno" },
          { id: "cerrado", name: "Cerrado", kind: "Final" },
        ],
        transitions: [
          { id: "t1", from: "borrador", to: "revision", label: "enviar", role: "Auditor" },
          { id: "t2", from: "revision", to: "devuelto", label: "devolver", role: "Jefe de Auditoría" },
          { id: "t3", from: "devuelto", to: "revision", label: "reenviar", role: "Auditor" },
          { id: "t4", from: "revision", to: "cerrado", label: "cerrar", role: "Jefe de Auditoría" },
        ],
      },
    }).as("generar");
    cy.visit("/app-builder/workflow/flow");
    cy.contains("button", "Revisar").click();
    cy.contains("summary", "Crear el flujo desde una descripción").click();
    cy.contains("button", "Proponer flujo con IA").should("be.disabled");
    cy.get("textarea").type("El auditor documenta, el jefe revisa; dudas a ana@femsa.com");
    cy.contains("Tu descripción parece tener un correo o un teléfono");
    cy.contains("button", "Proponer flujo con IA").click();
    cy.wait("@generar").its("request.body").should("deep.equal", {
      description: "El auditor documenta, el jefe revisa; dudas a ana@femsa.com",
    });
    cy.get("[aria-label='Propuesta de flujo']")
      .should("contain", "de la propuesta de la IA")
      .and("contain", "4 estados");
    cy.contains("Se quitaron correos o teléfonos");
    cy.contains("button", "Usar este flujo").click();
    // Lo que la IA no puso, lo proponen las reglas de control.
    cy.contains("li", "«devolver» debería pedir un comentario");
    cy.contains("li", "«cerrar» debería pedir evidencia");

    cy.intercept("POST", "/api/ai/workflow/generate", {
      aiAvailable: false,
      aiUnavailableReason: "not-configured",
      aiRetryAt: null,
      redacted: false,
      provider: "gemini",
      promptVersion: null,
      latencyMs: 1,
      workflow: null,
    });
    cy.contains("button", "Proponer flujo con IA").click();
    cy.contains("[role=status]", "La IA no está configurada en el servidor.").should("contain", "plantilla");
  });

  it("fase 3: cada decisión se registra con el formulario y se ven las métricas del flujo", () => {
    cy.intercept("POST", "/api/ai/workflow/decisions", { statusCode: 201, body: { recommendation: {} } }).as(
      "decision",
    );
    cy.visit("/app-builder/workflow/flow");
    cy.contains("button", "Revisar").click();
    cy.get("[aria-label='Métricas del asistente']").should("contain", "67 %");
    cy.contains("li", "«cerrar» no tiene rol asignado").contains("button", "Aceptar").click();
    cy.wait("@decision")
      .its("request.body")
      .should((body) => {
        expect(body.appId).to.equal("layout dummy");
        expect(body.decision).to.equal("accepted");
        expect(body.suggestion.rule).to.equal("transition-without-role");
        expect(body.suggestion.change).to.deep.equal({
          op: "set-transition-role",
          transitionId: "close",
          role: "Dirección de Auditoría",
        });
      });
    cy.wait("@metricas");

    // Si no se puede registrar, el cambio igual queda y se avisa sin bloquear.
    cy.intercept("POST", "/api/ai/workflow/decisions", { statusCode: 503, body: { msg: "Falta la migración" } });
    cy.contains("li", "«devolver a revisión» no tiene rol asignado").contains("button", "Rechazar").click();
    cy.contains("No se pudo registrar la decisión para las métricas; el cambio sí se aplicó al flujo.");
  });

  it("solo lectura: se puede revisar el flujo pero no editarlo", () => {
    cy.intercept("GET", "/api/permissions/me", {
      permissions: { "app-builder": "read", risks: "read", reports: "read" },
      canManagePermissions: false,
    });
    cy.visit("/app-builder/workflow/flow");
    editor().find("form").should("not.exist");
    cy.contains("button", "Ordenar diagrama").should("not.exist");
    cy.get("[role=button][aria-label='Estado Cerrado (Final)']").click();
    inspector().contains("label", "Nombre").find("input").should("be.disabled");
    inspector().contains("button", "Eliminar estado").should("not.exist");
    cy.get("button[aria-label='Deshacer']").should("not.exist");
    cy.contains("button", "Asistente de diseño").click();
    cy.contains("summary", "Crear el flujo desde una descripción").should("not.exist");
    cy.contains("li", "«cerrar» no tiene rol asignado").click();
    cy.contains("Solo lectura: tu rol no puede aplicar cambios al flujo.");
  });
});
