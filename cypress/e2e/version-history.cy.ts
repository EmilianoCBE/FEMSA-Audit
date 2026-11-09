describe("Historial de versiones (US11)", () => {
  const titulo = {
    id: "titulo",
    type: "short-text",
    x: 24,
    y: 24,
    width: 280,
    height: 48,
    config: { label: "Titulo" },
  };
  const monto = { id: "monto", type: "number", x: 24, y: 96, width: 200, height: 48, config: { label: "Monto" } };
  const layout = {
    id: "layout dummy",
    name: "Modulo de hallazgos",
    elements: [titulo, monto],
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
    createdAt: "2026-10-01T18:00:00.000Z",
    publishedAt: "2026-10-02T18:00:00.000Z",
    publishedBy: "Ana Auditora",
    restoredFrom: null,
  };
  const v2 = { ...v1, id: "2", version: "v2", status: "draft", changes: ["Se agregó Monto"], publishedAt: null };
  const v3 = { ...v2, id: "3", version: "v3", changes: ["Se restauró la configuración de la versión v1"] };
  const v1Config = { elements: [titulo] };

  let versions: object[];
  let designer: { versionId: string | null; hasUnversionedChanges: boolean };
  let canEdit: boolean;

  beforeEach(() => {
    versions = [v1];
    designer = { versionId: null, hasUnversionedChanges: true };
    canEdit = true;
    cy.intercept("GET", "/api/auth/me", { fixture: "user-admin.json" });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [layout] });
    cy.intercept("GET", "/api/designer/layouts/layout%20dummy", { layout });
    cy.intercept("GET", versionsUrl, (req) => req.reply({ versions, designer, canEdit }));
    cy.intercept("GET", `${versionsUrl}/1`, { version: { ...v1, config: v1Config } });
  });

  it("sugiere los cambios y guarda la configuración actual como un borrador nuevo", () => {
    cy.intercept("POST", versionsUrl, (req) => {
      versions = [v2, v1];
      designer = { versionId: "2", hasUnversionedChanges: false };
      req.reply(201, { version: { ...v2, config: req.body.config } });
    }).as("save");

    cy.visit("/app-builder/designer/history");
    cy.contains("article", "v1").should("contain", "Vigente").and("contain", "Publicada el");
    cy.contains("El Designer tiene cambios que no están guardados en ninguna versión.");

    cy.contains("button", "Guardar versión").click();
    cy.get("form textarea").should("have.value", "Se agregó el campo Monto");
    cy.contains("form", "1 de 20 cambios");
    cy.get("form textarea").clear().type("Se agregó Monto");
    cy.get("form").contains("button", "Guardar versión").click();

    cy.wait("@save")
      .its("request.body")
      .should("deep.equal", { config: { elements: layout.elements }, changes: ["Se agregó Monto"] });
    cy.get("[role=status]").should("contain", "Se guardó v2 como borrador.");
    cy.get("article[aria-label='Versión v2']").should("contain", "Borrador").and("contain", "En el Designer");
    cy.contains("button", "Guardar versión").should("be.disabled");
  });

  it("avisa si un cambio es demasiado largo antes de enviarlo", () => {
    cy.visit("/app-builder/designer/history");
    cy.contains("button", "Guardar versión").click();
    cy.get("form textarea").clear().type("x".repeat(301), { delay: 0 });
    cy.contains("El cambio 1 tiene 301 caracteres (máximo 300).");
    cy.get("form").contains("button", "Guardar versión").should("be.disabled");
  });

  it("consulta una versión y la restaura respaldando antes los cambios del Designer", () => {
    versions = [v2, v1];
    cy.intercept("POST", `${versionsUrl}/1/restore`, (req) => {
      const backup = { ...v2, id: "4", version: "v4", changes: ["Estado del Designer antes de restaurar v1"] };
      const restored = { ...v3, id: "5", version: "v5", restoredFrom: "v1", config: v1Config };
      versions = [restored, backup, v2, v1];
      designer = { versionId: "5", hasUnversionedChanges: false };
      req.reply(201, { version: restored, backup: { ...backup, config: layout } });
    }).as("restore");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v1']").within(() => {
      cy.contains("button", "Ver").click();
      cy.contains("Campos en esta versión");
      cy.contains("li", "Titulo").should("contain", "Texto corto");

      cy.contains("button", "Restaurar").click();
      cy.contains("se guardarán antes como borrador");
      cy.contains("button", "Restaurar como borrador").click();
    });

    cy.wait("@restore");
    cy.get("[role=status]").should(
      "contain",
      "Se restauró la configuración de v1 como v5 (borrador). El estado anterior del Designer se guardó como v4.",
    );
    cy.get("article[aria-label='Versión v5']").should("contain", "En el Designer").and("contain", "Restaurada de v1");
  });

  it("restaura y publica en un solo paso", () => {
    versions = [v2, v1];
    designer = { versionId: "2", hasUnversionedChanges: false };
    cy.intercept("POST", `${versionsUrl}/1/restore`, {
      statusCode: 201,
      body: { version: { ...v3, restoredFrom: "v1", config: v1Config }, backup: null },
    }).as("restore");
    cy.intercept("POST", `${versionsUrl}/3/publish`, (req) => {
      versions = [
        { ...v3, status: "current", publishedAt: "2026-10-18T01:00:00.000Z" },
        v2,
        { ...v1, status: "archived" },
      ];
      req.reply({ version: versions[0] });
    }).as("publish");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v2']").should("not.contain", "Restaurar");
    cy.get("article[aria-label='Versión v1']").within(() => {
      cy.contains("button", "Restaurar").click();
      cy.contains("button", "Restaurar y publicar").click();
    });

    cy.wait("@restore");
    cy.wait("@publish");
    cy.get("[role=status]").should("contain", "como v3 y ahora es la versión vigente.");
    cy.get("article[aria-label='Versión v1']").should("contain", "Archivada");
  });

  it("pide confirmación para publicar y para descartar un borrador", () => {
    versions = [v2, v1];
    cy.intercept("POST", `${versionsUrl}/2/publish`, (req) => {
      versions = [
        { ...v2, status: "current", publishedAt: "2026-10-17T18:00:00.000Z" },
        { ...v1, status: "archived" },
      ];
      req.reply({ version: versions[0] });
    }).as("publish");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v2']").within(() => {
      cy.contains("button", "Descartar").click();
      cy.contains("v2 dejará de aparecer en el historial");
      cy.contains("button", "Cancelar").click();

      cy.contains("button", "Publicar").click();
      cy.contains("v2 será la versión vigente y v1 pasará a Archivada.");
      cy.contains("button", "Publicar v2").click();
    });

    cy.wait("@publish");
    cy.get("[role=status]").should("contain", "v2 es ahora la versión vigente.");
    cy.get("article[aria-label='Versión v1']").should("contain", "Archivada");
    cy.get("[role=status]").find("button[aria-label='Cerrar mensaje']").click();
    cy.get("[role=status]").should("not.exist");
  });

  it("descarta un borrador", () => {
    versions = [v2, v1];
    cy.intercept("POST", `${versionsUrl}/2/discard`, (req) => {
      versions = [v1];
      req.reply({ version: { ...v2, status: "discarded" } });
    }).as("discard");

    cy.visit("/app-builder/designer/history");
    cy.get("article[aria-label='Versión v2']").within(() => {
      cy.contains("button", "Descartar").click();
      cy.contains("button", "Descartar v2").click();
    });

    cy.wait("@discard");
    cy.get("[role=status]").should("contain", "Se descartó v2.");
    cy.get("article[aria-label='Versión v2']").should("not.exist");
  });

  it("compara una versión con el Designer actual", () => {
    cy.visit("/app-builder/designer/history");
    cy.contains("button", "Comparar versiones").click();

    cy.get("section[aria-label='Comparar versiones']").within(() => {
      cy.contains("Campos agregados (1)");
      cy.contains("li", "Monto");
    });
  });

  it("avisa al salir de Campos con cambios sin guardar y puede guardarlos antes de ir al historial", () => {
    cy.intercept("PUT", "/api/designer/layouts/layout%20dummy/canvas", (req) => {
      req.reply({ layout: { ...layout, elements: req.body.elements } });
    }).as("canvas");

    cy.visit("/app-builder/designer/fields");
    cy.contains("button", "+ Agregar campo").click();
    cy.contains("a", "Historial de versiones").click();

    cy.get("[role=alertdialog]").should("contain", "Tienes cambios sin guardar");
    cy.contains("button", "Seguir editando").click();
    cy.get("[role=alertdialog]").should("not.exist");
    cy.location("pathname").should("eq", "/app-builder/designer/fields");

    cy.contains("a", "Historial de versiones").click();
    cy.contains("button", "Guardar y salir").click();
    cy.wait("@canvas");
    cy.location("pathname").should("eq", "/app-builder/designer/history");
  });

  it("los roles sin permiso solo pueden consultar", () => {
    canEdit = false;
    versions = [v2, v1];
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });

    cy.visit("/app-builder/designer/history");
    cy.contains("Solo lectura");
    cy.contains("button", "Guardar versión").should("not.exist");
    cy.get("article[aria-label='Versión v2']").within(() => {
      cy.contains("button", "Ver").should("exist");
      cy.contains("button", "Publicar").should("not.exist");
      cy.contains("button", "Descartar").should("not.exist");
      cy.contains("button", "Restaurar").should("not.exist");
    });
  });
});
