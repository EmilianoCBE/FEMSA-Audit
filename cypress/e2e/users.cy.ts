describe("US02 Usuarios y roles", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/users", { fixture: "users.json" }).as("users");
    cy.intercept("GET", "/api/users/roles", { fixture: "roles.json" }).as("roles");
  });

  it("US02.4 un usuario sin rol de administrador no entra a la pantalla", () => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.visit("/users");
    cy.location("pathname").should("not.eq", "/users");
    cy.contains("h1", "Usuarios y roles").should("not.exist");
  });

  describe("como administrador", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/auth/me", { fixture: "user-admin.json" });
      cy.visit("/users");
      cy.wait(["@users", "@roles"]);
    });

    it("US02.1 lista y filtra a los usuarios registrados", () => {
      cy.contains("h1", "Usuarios y roles");
      cy.contains("Ada Administradora");
      cy.contains("Daniela Aedo");
      cy.get('input[placeholder="Buscar por nombre, correo o rol..."]').type("daniela");
      cy.contains("Daniela Aedo");
      cy.contains("td", "Ada Administradora").should("not.exist");
    });

    it("US02.2 cambia el rol de un usuario", () => {
      cy.intercept("PUT", "/api/users/2/role", {
        message: "ok",
        user: { user_id: 2, email: "daniela.aedo@femsa.com", full_name: "Daniela Aedo", role_id: 1 },
      }).as("updateRole");

      cy.get('select[aria-label="Cambiar rol de Daniela Aedo"]').select("Creador de aplicaciones");

      cy.wait("@updateRole").its("request.body").should("deep.equal", { role_id: 1 });
      cy.get("[role=status]").should("contain", "Se actualizó el rol de Daniela Aedo");
    });

    it("crea un usuario con correo corporativo sin repetir uno existente", () => {
      cy.intercept("POST", "/api/users", {
        statusCode: 201,
        body: {
          message: "ok",
          user: {
            user_id: 3,
            email: "daniela.aedo2@femsa.com",
            full_name: "Daniela Aedo",
            is_active: true,
            created_at: "2026-10-18T00:00:00Z",
            role_id: 3,
          },
        },
      }).as("create");

      cy.contains("button", "Agregar nuevo usuario").click();
      cy.get("#new-first-name").type("Daniela");
      cy.get("#new-last-name").type("Aedo");
      cy.contains("daniela.aedo2@femsa.com");
      cy.get("#new-role").select("Visualizador");
      cy.get("#new-password").type("corta");
      cy.get("#confirm-password").type("corta");
      cy.contains("button", "Crear usuario").should("be.disabled");

      cy.get("#new-password").clear().type("contraseña-segura");
      cy.get("#confirm-password").clear().type("contraseña-segura");
      cy.contains("button", "Crear usuario").click();

      cy.wait("@create")
        .its("request.body")
        .should("deep.equal", { firstName: "Daniela", lastName: "Aedo", role_id: 3, password: "contraseña-segura" });
      cy.get("[role=status]").should("contain", "daniela.aedo2@femsa.com");
    });
  });
});
