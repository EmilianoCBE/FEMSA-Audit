const RISKS = [
  {
    risk_library_id: "R-001",
    risk_name: "Acceso no autorizado a SAP",
    audit_department: "Beverage",
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    risk_library_id: "R-002",
    risk_name: "Inventario sin conciliar",
    audit_department: "Retail & Spin",
    created_at: "2026-09-01T00:00:00Z",
  },
];

const EMPTY_SUMMARY = {
  totalEvaluations: 0,
  averageScore: 0,
  highRisks: 0,
  criticalRisks: 0,
  byLevel: [],
  byDepartment: [],
  monthlyTrend: [],
  riskMatrix: [],
  byDepartmentLevel: [],
};

describe("US07 Clasificación de riesgos", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/me", { fixture: "user.json" });
    cy.intercept({ method: "GET", pathname: "/api/risk-library" }, { count: RISKS.length, risks: RISKS }).as("library");
    cy.intercept({ method: "GET", pathname: "/api/risk-evaluations" }, (req) =>
      req.reply({ evaluations: [], count: 0, total: 0, page: 1, pageSize: 10, totalPages: 1 }),
    ).as("history");
    cy.intercept({ method: "GET", pathname: "/api/risk-evaluations/summary" }, EMPTY_SUMMARY).as("summary");
    // Simula el cálculo del backend (models/risk.model.js) a partir de lo que envía la pantalla
    cy.intercept("POST", "/api/risks/classify", (req) => {
      const { probability, impact } = req.body as { probability: number; impact: number };
      const score = probability * impact;
      const level = score <= 4 ? "Bajo" : score <= 9 ? "Medio" : score <= 16 ? "Alto" : "Crítico";
      req.reply({ result: { probability, impact, score, level } });
    }).as("classify");
    cy.visit("/riesgos/clasificacion");
    cy.wait("@library");
  });

  it("US07.1-US07.4 calcula y recalcula el nivel al cambiar probabilidad e impacto", () => {
    cy.contains("h3", "Selecciona un riesgo");
    cy.contains("button", "R-001").click();

    cy.wait("@classify").its("request.body").should("deep.equal", { probability: 3, impact: 3 });
    cy.contains("Resultado de la evaluación");
    cy.contains("9/25");
    cy.contains("Medio");

    cy.get("#probability").select("5");
    cy.get("#impact").select("4");
    cy.wait("@classify");
    cy.wait("@classify").its("request.body").should("deep.equal", { probability: 5, impact: 4 });
    cy.contains("20/25");
    cy.contains("Crítico");
  });

  it("guarda la evaluación y refresca el historial", () => {
    cy.intercept("POST", "/api/risk-evaluations", { statusCode: 201, body: { message: "ok" } }).as("save");

    cy.contains("button", "R-002").click();
    cy.wait("@classify");
    cy.wait(["@history", "@summary"]);
    cy.contains("button", "Guardar evaluación").click();

    cy.wait("@save").its("request.body").should("deep.equal", { riskLibraryId: "R-002", probability: 3, impact: 3 });
    cy.get("[role=status]").should("contain", "Evaluación guardada correctamente");
    cy.wait("@history");
  });

  it("muestra el error del backend si no se puede cargar la biblioteca", () => {
    cy.intercept(
      { method: "GET", pathname: "/api/risk-library" },
      { statusCode: 500, body: { msg: "Error al consultar la biblioteca" } },
    ).as("libraryError");
    cy.get("#risk-search").type("SAP");
    cy.wait("@libraryError");
    cy.contains("Error al consultar la biblioteca");
  });
});
