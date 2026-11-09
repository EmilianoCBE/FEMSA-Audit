describe("Layout en escritorio", () => {
  // Laptop chica, laptop, Full HD (zoom 1.125), QHD (zoom 1.333) y 4K (zoom 2).
  for (const [width, height] of [
    [1000, 400],
    [1440, 720],
    [1920, 1080],
    [2560, 1440],
    [3840, 2160],
  ]) {
    it(`en ${width}x${height} solo hace scroll el contenido y el usuario / cerrar sesión siempre se ve`, () => {
      cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
      cy.viewport(width, height);
      cy.visit("/app-builder/designer/fields");
      cy.contains("Designer del formulario");
      cy.get("[data-app-scroll]").scrollTo("bottom", { ensureScrollable: false });

      cy.window().then((win) => {
        expect(win.document.documentElement.scrollHeight, "la ventana no hace scroll").to.be.at.most(
          win.innerHeight + 1,
        );
      });
      cy.get(".app-topbar").then(($topbar) => expect($topbar[0].getBoundingClientRect().top).to.equal(0));
      cy.contains("aside", "Ana Auditora")
        .find("button")
        .last()
        .then(($logout) => {
          cy.window().then((win) =>
            expect($logout[0].getBoundingClientRect().bottom).to.be.at.most(win.innerHeight + 1),
          );
        });
    });
  }
});
