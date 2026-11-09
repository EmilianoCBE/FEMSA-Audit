import type { ElementoDesigner } from "../designer/types";

export type DesignerFieldType = ElementoDesigner["type"];
export type DesignerSection = "identificacion" | "evaluacion" | "remediacion";

/** Cambios que el asistente puede proponer. Deben coincidir con `services/ai/schemas.js` del backend. */
export type DesignerChange =
  | { op: "change-field-type"; fieldId: string; type: DesignerFieldType }
  | { op: "rename-field"; fieldId: string; label: string }
  | { op: "set-required"; fieldId: string; required: boolean }
  | { op: "set-formula"; fieldId: string; formula: string }
  | { op: "add-field"; type: DesignerFieldType; label: string; section?: DesignerSection };

export type SuggestionKind = "inconsistency" | "component" | "field";
export type SuggestionSource = "rules" | "ai";
export type SuggestionConfidence = "alta" | "media" | "baja";

export type DesignerSuggestion = {
  id: string;
  source: SuggestionSource;
  kind: SuggestionKind;
  title: string;
  /** Explicación obligatoria (RNF-12). */
  reason: string;
  confidence: SuggestionConfidence;
  fieldId?: string;
  change?: DesignerChange;
};

/** US18: por qué no hay IA. `paused` = falló hace poco y el servidor espera antes de volver a llamarla. */
export type AiUnavailableReason = "not-configured" | "timeout" | "error" | "paused";

/** US18: estado de la IA sin llamarla (`GET /api/ai/status`). */
export type AiStatus = {
  aiAvailable: boolean;
  reason: AiUnavailableReason | null;
  retryAt: string | null;
  provider: string;
};

export type DesignerAnalysis = {
  appId: string;
  /** false si la IA falló o tardó: solo vienen las reglas (US18). */
  aiAvailable: boolean;
  aiUnavailableReason?: AiUnavailableReason | null;
  /** A partir de cuándo el servidor vuelve a intentar con la IA. */
  aiRetryAt?: string | null;
  /** true si las sugerencias se guardaron en la BD y se pueden registrar las decisiones. */
  recorded: boolean;
  provider: string;
  promptVersion: string | null;
  latencyMs: number;
  suggestions: DesignerSuggestion[];
};

/** Decisión del usuario sobre una sugerencia (US17). */
export type SuggestionDecision = "accepted" | "rejected" | "replaced";

export type DecisionCounts = { total: number; pending: number; accepted: number; rejected: number; replaced: number };

/** Métricas del asistente para un formulario (`GET /api/ai/designer/metrics`). */
export type DesignerMetrics = {
  appId: string;
  bySource: Record<SuggestionSource, DecisionCounts>;
  /** Aceptadas + reemplazadas entre las decididas (0–1); `null` si no hay decisiones. */
  acceptanceRate: Record<SuggestionSource, number | null>;
  avgAiLatencyMs: number | null;
};
