describe("US13 permisos predeterminados por rol", () => {
  const url = "/app-builder/designer/permissions";
  const matrix = () => ({
    roles: [
      { id: "2", label: "Administrador" },
      { id: "3", label: "Visualizador" },
    ],
    permissions: [
      { fieldId: "app-builder", fieldName: "App Builder", levels: { "2": "edit", "3": "read" } },
      { fieldId: "risks", fieldName: "Riesgos", levels: { "2": "edit", "3": "read" } },
    ],
  });
  beforeEach(() => {
    cy.viewport(1280, 850);
    cy.intercept("GET", "/api/auth/me", { fixture: "user-admin.json" });
    cy.intercept("GET", "/api/permissions/me", {
      permissions: { "app-builder": "edit", risks: "edit", reports: "edit" },
      canManagePermissions: true,
    });
  });
  it("guarda el permiso y lo conserva al recargar; bloquea cambios al administrador", () => {
    const data = matrix();
    cy.intercept("GET", "/api/permissions", (req) => req.reply(data));
    cy.intercept("PUT", "/api/permissions/3/risks", (req) => {
      expect(req.body).to.deep.equal({ level: "hidden" });
      data.permissions[1].levels["3"] = "hidden";
      req.reply({ roleId: 3, moduleId: "risks", level: "hidden" });
    }).as("save");
    cy.visit(url);
    cy.get('button[aria-label="Riesgos · Administrador: Edición"]').should("be.disabled");
    cy.get('button[aria-label="Riesgos · Visualizador: Lectura"]').click();
    cy.wait("@save");
    cy.contains("Permiso guardado correctamente.");
    cy.reload();
    cy.get('button[aria-label="Riesgos · Visualizador: Oculto"]').should("be.visible");
  });
  it("revierte la matriz y muestra el error cuando falla el guardado", () => {
    cy.intercept("GET", "/api/permissions", matrix());
    cy.intercept("PUT", "/api/permissions/3/risks", { statusCode: 500, body: { msg: "No se pudo guardar" } });
    cy.visit(url);
    cy.get('button[aria-label="Riesgos · Visualizador: Lectura"]').click();
    cy.contains('[role="alert"]', "No se pudo guardar");
    cy.get('button[aria-label="Riesgos · Visualizador: Lectura"]').should("be.visible");
  });
  it("un usuario no administrador no puede abrir la administración por URL", () => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept("GET", "/api/permissions/me", {
      permissions: { "app-builder": "read", risks: "hidden", reports: "read" },
      canManagePermissions: false,
    });
    cy.visit(url);
    cy.contains("Tu rol no tiene acceso a esta sección.");
    cy.contains("a", "Clasificación de riesgos").should("not.exist");
    cy.get('button[aria-label^="Riesgos ·"]').should("not.exist");
  });
  it("bloquea módulos ocultos y deshabilita guardar plantillas en lectura", () => {
    cy.intercept("GET", "/api/permissions/me", {
      permissions: { "app-builder": "read", risks: "hidden", reports: "read" },
      canManagePermissions: false,
    });
    cy.intercept("GET", "/api/designer/layouts", { layouts: [] });
    cy.visit("/app-builder/designer/fields");
    cy.contains("Acceso de solo lectura.");
    cy.contains("button", "Nueva plantilla").should("be.disabled");
    cy.visit("/riesgos/clasificacion");
    cy.contains("Tu rol no tiene acceso a esta sección.");
  });
});
