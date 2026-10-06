describe("Login", () => {
  it("redirige a /login cuando no hay sesión", () => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: { msg: "No autenticado" } });

    cy.visit("/app-builder/workflow");

    cy.location("pathname").should("eq", "/login");
    cy.contains("h2", "Inicia sesión");
  });

  it("muestra el error del backend con credenciales inválidas", () => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: { msg: "No autenticado" } });
    cy.intercept("POST", "/api/auth/login", { statusCode: 401, body: { msg: "Usuario o contraseña incorrectos." } });

    cy.visit("/login");
    cy.get("#identifier").type("ana");
    cy.get("#password").type("contraseña-incorrecta");
    cy.contains("button", "Ingresar con usuario y contraseña").click();

    cy.get("[role=alert]").should("contain", "Usuario o contraseña incorrectos.");
  });

  it("inicia sesión y entra a la aplicación", () => {
    cy.intercept("GET", "/api/auth/me", { statusCode: 401, body: { msg: "No autenticado" } });
    cy.intercept("POST", "/api/auth/login", { fixture: "user.json" }).as("login");

    cy.visit("/login");
    cy.get("#identifier").type("ana");
    cy.get("#password").type("una-contraseña-segura");
    cy.contains("button", "Ingresar con usuario y contraseña").click();

    cy.wait("@login")
      .its("request.body")
      .should("deep.equal", { identifier: "ana", password: "una-contraseña-segura" });
    cy.location("pathname").should("not.eq", "/login");
    cy.contains("Ana Auditora");
  });
});
