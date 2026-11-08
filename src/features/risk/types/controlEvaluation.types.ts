
export type Probability =
  | "Inminente"
  | "Altamente probable"
  | "Probable"
  | "No probable"
  | "Remota";

export type Impact =
  | "Menor"
  | "Bajo"
  | "Moderado"
  | "Alto"
  | "Crítico";

export type ControlRating =
  | "Inicial"
  | "Funcional"
  | "Definido"
  | "Gestionado"
  | "Optimizado";

/**
 * Información organizacional relacionada con un control
 * mediante las tablas CONTROL_CATALOG y ORG_CATALOG.
 */
export type ControlCatalogInfo = {
  catalogCodes: string | null;
  auditDepartments: string | null;
  auditDomains: string | null;
  businessUnits: string | null;
  divisions: string | null;
  subdivisions: string | null;
  areas: string | null;
  countries: string | null;
};

export type ResidualRisk = {
  value: number;
  level: string;
  evaluatedControls: number;
};

export type RiskWithControlsSummary = {
  riskId: number;
  trackingId: string;
  name: string;
  category: string;
  inherentLevel: string;
  controls: ({
    controlId: number;
    trackingId: string;
    name: string;
    domain: string | null;
  } & ControlCatalogInfo)[];
};

export type ControlEvaluation = {
  evaluationId: number;
  probability: Probability;
  impact: Impact;
  inherentLevel: string;
  designRating: ControlRating;
  effectivenessRating: ControlRating;
  controlLevel: string;
  vulnerability: string;
  evaluatedAt: string;
  comments: string | null;
};

export type RiskWithControlsDetail = {
  risk: {
    riskId: number;
    trackingId: string;
    name: string;
    category: string;
    inherentLevel: string;
  };
  controls: ({
    controlId: number;
    trackingId: string;
    name: string;
    domain: string | null;
    latestEvaluation: ControlEvaluation | null;
  } & ControlCatalogInfo)[];
  residualRisk: ResidualRisk | null;
};

export type ControlEvaluationHistory = {
  control: {
    controlId: number;
    trackingId: string;
    name: string;
  } & ControlCatalogInfo;
  risk: {
    riskId: number;
    trackingId: string;
    name: string;
  };
  evaluations: (ControlEvaluation & {
    evaluatedByUserId: number;
    evaluatedByUserName: string | null;
  })[];
  count: number;
};

export type CreateControlEvaluationRequest = {
  controlId: number;
  probability: Probability;
  impact: Impact;
  designRating: ControlRating;
  effectivenessRating: ControlRating;
  comments?: string;
};

export type CreateControlEvaluationResponse = {
  message: string;
  evaluation: ControlEvaluation & {
    controlId: number;
    evaluatedByUserId: number;
    evaluatedByUserName: string | null;
  };
};
