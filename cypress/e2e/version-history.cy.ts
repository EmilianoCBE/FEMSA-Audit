describe("Historial de versiones (US11)", () => {
  const layout = {
    id: "layout dummy",
    name: "Modulo de hallazgos",
    elements: [{ id: "titulo", type: "short-text", x: 24, y: 24, width: 280, height: 48, config: { label: "Titulo" } }],
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const versionsUrl = "/api/apps/layout%20dummy/versions";
  const v1 = {
    id: "1",
    version: "v1",
    status: "current",
    author: "Ana Auditora",
    changes: ["Versión inicial"],
    publishedAt: "2026-10-02T00:00:00.000Z",
    restoredFrom: null,
  };
  const v2 = { ...v1, id: "2", version: "v2", status: "draft", changes: ["Se agregó Titulo"], publishedAt: null };
  const v3 = { ...v2, id: "3", version: "v3", changes: ["Se restauró la configuración de la versión v1"] };

  let versions: object[];

  beforeEach(() => {
    versions = [v1];
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout] });
    cy.intercept("GET", "/api/designer/layouts/layout%20dummy", { layout });
    cy.intercept("GET", versionsUrl, (req) => req.reply({ versions }));
  });

  it("guarda la configuración actual como un borrador nuevo", () => {
    cy.intercept("POST", versionsUrl, (req) => {
      versions = [v2, v1];
      req.reply(201, { version: { ...v2, config: req.body.config } });
    }).as("save");

    cy.visit("/app-builder/designer/history");
    cy.contains("article", "v1").should("contain", "Vigente");

    cy.contains("button", "Guardar versión").click();
    cy.get("form textarea").type("Se agregó Titulo");
    cy.get("form").contains("button", "Guardar versión").click();

    cy.wait("@save")
      .its("request.body")
      .should("deep.equal", { config: { elements: layout.elements }, changes: ["Se agregó Titulo"] });
    cy.get("[role=status]").should("contain", "Se guardó v2 como borrador.");
    cy.contains("article", "v2").should("contain", "Borrador").and("contain", "Se agregó Titulo");
  });

  it("consulta una versión y restaura su configuración en el Designer", () => {
    versions = [v2, v1];
    cy.intercept("GET", `${versionsUrl}/1`, { version: { ...v1, config: { elements: layout.elements } } });
    cy.intercept("POST", `${versionsUrl}/1/restore`, (req) => {
      versions = [v3, v2, v1];
      req.reply(201, { version: { ...v3, restoredFrom: "v1", config: { elements: layout.elements } } });
    }).as("restore");
    cy.intercept("PUT", "/api/designer/layouts/layout%20dummy/canvas", { layout }).as("canvas");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v1']").within(() => {
      cy.contains("button", "Ver").click();
      cy.contains("Campos en esta versión");
      cy.contains("li", "Titulo");

      cy.contains("button", "Restaurar").click();
      cy.contains("button", "Restaurar v1").click();
    });

    cy.wait("@restore");
    cy.wait("@canvas").its("request.body").should("deep.equal", { elements: layout.elements });
    cy.get("[role=status]").should("contain", "Se restauró la configuración de v1 como v3 (borrador).");
    cy.contains("article", "v3").should("contain", "Se restauró la configuración de la versión v1");
  });

  it("publica un borrador", () => {
    versions = [v2, v1];
    cy.intercept("POST", `${versionsUrl}/2/publish`, (req) => {
      versions = [
        { ...v2, status: "current", publishedAt: "2026-10-17T00:00:00.000Z" },
        { ...v1, status: "archived" },
      ];
      req.reply({ version: versions[0] });
    }).as("publish");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v2']").contains("button", "Publicar").click();

    cy.wait("@publish");
    cy.get("[role=status]").should("contain", "v2 es ahora la versión vigente.");
    cy.get("article[aria-label='Versión v1']").should("contain", "Archivada");
  });
});
