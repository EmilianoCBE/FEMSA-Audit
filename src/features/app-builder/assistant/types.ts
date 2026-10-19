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

export type DesignerAnalysis = {
  appId: string;
  /** false si la IA falló o tardó: solo vienen las reglas (US18). */
  aiAvailable: boolean;
  provider: string;
  promptVersion: string | null;
  latencyMs: number;
  suggestions: DesignerSuggestion[];
};

/** Decisión del usuario sobre una sugerencia (US17). */
export type SuggestionDecision = "accepted" | "rejected" | "replaced";
