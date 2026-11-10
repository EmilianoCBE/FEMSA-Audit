// Fase 4 del workflow: procesos que recorren el flujo con la versión con la que empezaron.
describe("Procesos del workflow (fase 4)", () => {
  const layout = { id: "layout dummy", name: "Modulo de hallazgos", elements: [], workflow: null };
  const workflow = {
    size: { width: 700, height: 260 },
    states: [
      { id: "borrador", kind: "Inicial", name: "Borrador", tone: "neutral", position: { x: 22, y: 20 } },
      {
        id: "revision",
        kind: "Aprobación",
        name: "Revisión del jefe",
        tone: "accent",
        position: { x: 292, y: 20 },
        slaDays: 5,
      },
      { id: "cerrado", kind: "Final", name: "Cerrado", tone: "green", position: { x: 562, y: 20 } },
    ],
    transitions: [
      {
        id: "enviar",
        label: "enviar",
        from: "borrador",
        to: "revision",
        role: "Auditor",
        variant: "default",
        requires: { evidence: true },
      },
      { id: "cerrar", label: "cerrar", from: "revision", to: "cerrado", role: "Jefe de Auditoría", variant: "default" },
    ],
    suggestedStates: [],
    annotations: [],
  };
  const summary = (overrides: object = {}) => ({
    id: "p1",
    appId: "layout dummy",
    title: "Pagos sin firma del gerente",
    status: "active",
    version: { id: 7, number: 3, isCurrent: true },
    currentState: { id: "borrador", name: "Borrador", kind: "Inicial" },
    daysInState: 0,
    slaDays: null,
    overdue: false,
    startedBy: "Ana Auditora",
    startedAt: "2026-11-09T16:00:00.000Z",
    completedAt: null,
    ...overrides,
  });
  const start = {
    id: 1,
    transitionId: null,
    action: "iniciar",
    fromStateId: null,
    fromStateName: null,
    toStateId: "borrador",
    toStateName: "Borrador",
    actorName: "Ana Auditora",
    actorRole: "Auditor",
    comment: null,
    evidence: null,
    actionPlan: null,
    at: "2026-11-09T16:00:00.000Z",
  };
  const action = (overrides: object = {}) => ({
    transitionId: "enviar",
    label: "enviar",
    toStateId: "revision",
    toStateName: "Revisión del jefe",
    role: "Auditor",
    requires: { evidence: true },
    allowed: true,
    reason: null,
    ...overrides,
  });

  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout] });
  });

  it("inicia un proceso, ejecuta una transición con su evidencia y queda en el historial", () => {
    let processes: object[] = [];
    let detail: Record<string, unknown> = {
      ...summary(),
      workflow,
      myRoles: ["Auditor"],
      actions: [action()],
      history: [start],
    };
    cy.intercept("GET", "/api/workflow/instances?*", (request) => request.reply({ instances: processes }));
    cy.intercept("POST", "/api/workflow/instances", (request) => {
      processes = [summary({ title: request.body.title })];
      request.reply(201, { instance: processes[0] });
    }).as("iniciar");
    cy.intercept("GET", "/api/workflow/instances/p1", (request) => request.reply({ instance: detail }));
    cy.intercept("POST", "/api/workflow/instances/p1/transitions", (request) => {
      detail = {
        ...detail,
        currentState: { id: "revision", name: "Revisión del jefe", kind: "Aprobación" },
        slaDays: 5,
        actions: [
          action({
            transitionId: "cerrar",
            label: "cerrar",
            toStateName: "Cerrado",
            role: "Jefe de Auditoría",
            requires: {},
            allowed: false,
            reason: "La ejecuta Jefe de Auditoría.",
          }),
        ],
        history: [
          start,
          {
            ...start,
            id: 2,
            transitionId: "enviar",
            action: "enviar",
            fromStateName: "Borrador",
            toStateName: "Revisión del jefe",
            evidence: request.body.evidence,
          },
        ],
      };
      request.reply({ instance: detail });
    }).as("mover");

    cy.visit("/app-builder/workflow/processes");
    cy.contains("No hay procesos en curso.");
    cy.get("form[aria-label='Iniciar proceso']").within(() => {
      cy.get("input").type("Pagos sin firma del gerente");
      cy.contains("button", "Iniciar proceso").click();
    });
    cy.wait("@iniciar").its("request.body").should("deep.equal", {
      appId: "layout dummy",
      title: "Pagos sin firma del gerente",
    });
    cy.get("[aria-label='Procesos']").contains("Pagos sin firma del gerente");
    cy.location("search").should("contain", "process=p1");

    // Detalle: el flujo de su versión con el estado actual marcado.
    cy.get("[aria-selected=true]").should("contain", "Borrador");
    cy.contains("Tus roles en el flujo: Auditor.");
    cy.contains("button", "enviar").click();
    cy.contains("button", "Confirmar «enviar»").click();
    cy.contains("[role=alert]", "Indica la evidencia");
    cy.get("form[aria-label='Ejecutar enviar']").contains("label", "Evidencia").find("input").type("Muestreo.xlsx");
    cy.contains("button", "Confirmar «enviar»").click();
    cy.wait("@mover").its("request.body").should("deep.equal", { transitionId: "enviar", evidence: "Muestreo.xlsx" });

    cy.contains("Estado actual: Revisión del jefe");
    cy.contains("button", "cerrar").should("be.disabled");
    cy.contains("La ejecuta Jefe de Auditoría.");
    cy.get("[aria-label='Historial del proceso']")
      .should("contain", "ejecutó «enviar»: Borrador → Revisión del jefe")
      .and("contain", "Evidencia: Muestreo.xlsx");
  });

  it("un proceso de una versión anterior lo dice y sigue con su flujo; los vencidos se marcan", () => {
    const old = summary({
      version: { id: 5, number: 2, isCurrent: false },
      currentState: { id: "revision", name: "Revisión del jefe", kind: "Aprobación" },
      daysInState: 8,
      slaDays: 5,
      overdue: true,
    });
    cy.intercept("GET", "/api/workflow/instances?*", { instances: [old] });
    cy.intercept("GET", "/api/workflow/instances/p1", {
      instance: { ...old, workflow, myRoles: ["Auditor"], actions: [], history: [start] },
    });
    cy.visit("/app-builder/workflow/processes");
    cy.get("[aria-label='Procesos']")
      .should("contain", "v2 · versión anterior")
      .and("contain", "Vencido: 8 días (plazo 5)");
    cy.contains("button", "Pagos sin firma del gerente").click();
    cy.get("[role=note]").should(
      "contain",
      "Este proceso empezó con v2 y termina con ese flujo, aunque ya se publicó una versión más nueva.",
    );
  });

  it("si el formulario no tiene versión publicada con flujo, explica qué falta", () => {
    cy.intercept("GET", "/api/workflow/instances?*", { instances: [] });
    cy.intercept("POST", "/api/workflow/instances", {
      statusCode: 409,
      body: { msg: "La versión publicada (v15) no tiene flujo. Guarda el flujo, crea una versión y publícala." },
    });
    cy.visit("/app-builder/workflow/processes");
    cy.get("form[aria-label='Iniciar proceso'] input").type("Hallazgo de prueba");
    cy.contains("button", "Iniciar proceso").click();
    cy.contains("[role=alert]", "no tiene flujo");
  });

  it("al publicar una versión avisa que los procesos en curso siguen con la suya", () => {
    const versionsUrl = "/api/apps/layout%20dummy/versions";
    const v1 = {
      id: "1",
      version: "v1",
      status: "current",
      author: "Ana Auditora",
      changes: ["Versión inicial"],
      createdAt: "2026-10-01T18:00:00.000Z",
      publishedAt: "2026-10-02T18:00:00.000Z",
      publishedBy: "Ana Auditora",
      restoredFrom: null,
    };
    const v2 = { ...v1, id: "2", version: "v2", status: "draft", changes: ["Nuevo flujo"], publishedAt: null };
    cy.intercept("GET", "/api/auth/me", { fixture: "user-admin.json" });
    cy.intercept("GET", "/api/designer/layouts/layout%20dummy", { layout });
    cy.intercept("GET", versionsUrl, {
      versions: [v2, v1],
      designer: { versionId: "2", hasUnversionedChanges: false },
      canEdit: true,
    });
    cy.intercept("GET", "/api/workflow/instances/summary*", {
      appId: "layout dummy",
      activeByVersion: [{ appVersionId: 1, versionNumber: 1, active: 2 }],
    });
    cy.visit("/app-builder/workflow/history");
    cy.contains("article", "v2").contains("button", "Publicar").click();
    cy.get("fieldset[aria-label='Confirmar publicación de v2']").should(
      "contain",
      "2 procesos en curso seguirán con su versión hasta terminar (2 con v1); los nuevos usarán v2.",
    );
  });
});
