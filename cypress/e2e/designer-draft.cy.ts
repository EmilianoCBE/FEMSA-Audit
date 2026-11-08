describe("Borrador en el Designer (US10)", () => {
  const titulo = { id: "titulo", type: "short-text", x: 0, y: 0, width: 520, height: 56, config: { label: "Titulo" } };
  const riesgo = {
    id: "riesgo_residual",
    type: "number",
    x: 0,
    y: 1,
    width: 520,
    height: 56,
    config: { label: "Riesgo residual", section: "evaluacion" },
  };
  const layout = {
    id: "hallazgo",
    name: "Formulario de hallazgo",
    elements: [titulo],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const versionsUrl = "/api/apps/hallazgo/versions";
  const v1 = {
    id: "1",
    version: "v1",
    status: "current",
    author: "Ana Auditora",
    changes: ["Versión inicial"],
    publishedAt: "2026-10-02T00:00:00.000Z",
    restoredFrom: null,
  };
  const v2 = {
    ...v1,
    id: "2",
    version: "v2",
    status: "draft",
    changes: ["Se agregó Riesgo residual"],
    publishedAt: null,
  };

  let versions: object[];

  beforeEach(() => {
    versions = [v1];
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout] });
    cy.intercept("GET", versionsUrl, (req) => req.reply({ versions }));
  });

  it("US10.1 guarda el formulario como borrador sin tocar la plantilla", () => {
    cy.intercept("PUT", "/api/designer/layouts/**", cy.spy().as("canvas"));
    cy.intercept("POST", versionsUrl, (req) => {
      versions = [v2, v1];
      req.reply(201, { version: { ...v2, config: req.body.config } });
    }).as("save");

    cy.visit("/app-builder/designer/fields");
    cy.contains("Titulo");
    cy.contains("Borrador ·").should("not.exist");

    cy.contains("button", "Guardar borrador").click();

    cy.wait("@save").then(({ request }) => {
      expect(request.body.changes).to.deep.equal(["Borrador guardado desde el Designer"]);
      expect(request.body.config.elements.map((element: { id: string }) => element.id)).to.deep.equal(["titulo"]);
    });
    cy.get("[role=status]").should("contain", "Se guardó v2 como borrador. La versión vigente no cambia.");
    cy.contains("Borrador · v2");
    cy.contains("Estás editando un borrador sin publicar");
    cy.get("@canvas").should("not.have.been.called");
  });

  it("US10.2 avisa que hay un borrador y lo reabre con su configuración", () => {
    versions = [v2, v1];
    cy.intercept("GET", `${versionsUrl}/2`, { version: { ...v2, config: { elements: [titulo, riesgo] } } }).as("draft");

    cy.visit("/app-builder/designer/fields");
    cy.contains("Borrador · v2");
    cy.contains("Hay un borrador sin publicar de esta plantilla.");
    cy.contains("Riesgo residual").should("not.exist");

    cy.contains("button", "Abrir borrador").click();

    cy.wait("@draft");
    cy.contains("Riesgo residual");
    cy.get("[role=status]").should("contain", "Se abrió el borrador v2.");
    cy.contains("Estás editando un borrador sin publicar");
    cy.contains("button", "Abrir borrador").should("not.exist");
  });

  it("no deja abrir el borrador si hay cambios sin guardar", () => {
    versions = [v2, v1];

    cy.visit("/app-builder/designer/fields");
    cy.contains("button", "Abrir borrador").should("be.enabled");

    cy.contains("button", "+ Agregar campo").click();

    cy.contains("button", "Abrir borrador").should("be.disabled");
  });
});
