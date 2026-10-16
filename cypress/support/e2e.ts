/**
 * Las pruebas E2E no dependen del backend ni de Azure: toda llamada a /api se simula con cy.intercept.
 * Por defecto, cualquier endpoint no simulado responde 404 para que la prueba falle de forma explícita.
 */
beforeEach(() => {
  cy.intercept("/api/**", { statusCode: 404, body: { msg: "Endpoint no simulado en la prueba" } });
});
