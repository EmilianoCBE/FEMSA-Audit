import type { AiUnavailableReason } from "@/features/app-builder/assistant/types";
import type { WorkflowDiagram } from "../types";
import type { WorkflowChange, WorkflowRuleId, WorkflowSuggestion } from "./workflowAssistant";

// US15 (RF-17, RF-18) - Emiliano Carrizales: la IA sugiere transiciones y roles para el flujo.
// Aquí solo se arma lo que se envía (la estructura del flujo, RNF-13) y se convierte lo que regresa.

export type WorkflowAiRequest = {
  /** Fase 3: formulario del flujo, para que el back registre las sugerencias y sus decisiones. */
  appId?: string;
  states: { id: string; name: string; kind: string }[];
  transitions: { id: string; from: string; to: string; label: string; role: string | null }[];
  known: { title: string; change: WorkflowChange | null }[];
};

type WorkflowAiKind = "relation" | "role" | "inconsistency";

export type WorkflowAiAnalysis = {
  aiAvailable: boolean;
  aiUnavailableReason: AiUnavailableReason | null;
  aiRetryAt: string | null;
  provider: string;
  promptVersion: string | null;
  latencyMs: number;
  /** Fase 3: si se guardaron (entonces cada decisión se registra con su id). */
  recorded?: boolean;
  suggestions: {
    id: string;
    kind: WorkflowAiKind;
    title: string;
    reason: string;
    confidence: "alta" | "media" | "baja";
    target?: { type: "state" | "transition"; id: string };
    change?: WorkflowChange;
  }[];
};

const RULE_BY_KIND: Record<WorkflowAiKind, WorkflowRuleId> = {
  relation: "ai-relation",
  role: "ai-role",
  inconsistency: "ai-observation",
};

/** Solo estados y transiciones reales (las "sugeridas" del diseño no cuentan) y lo que ya dicen las reglas. */
export function buildWorkflowAiRequest(
  diagram: WorkflowDiagram,
  ruleSuggestions: readonly WorkflowSuggestion[],
  appId?: string,
): WorkflowAiRequest {
  const stateIds = new Set(diagram.states.map((state) => state.id));
  return {
    ...(appId && { appId }),
    states: diagram.states.map(({ id, name, kind }) => ({ id, name, kind })),
    transitions: diagram.transitions
      .filter(
        (transition) =>
          transition.variant !== "suggested" && stateIds.has(transition.from) && stateIds.has(transition.to),
      )
      .map(({ id, from, to, label, role }) => ({ id, from, to, label, role })),
    known: ruleSuggestions.map(({ title, change }) => ({ title, change: change ?? null })),
  };
}

/** Las propuestas de la IA con la forma de la lista del asistente (se aceptan con applyWorkflowChange). */
export function toWorkflowSuggestions(analysis: WorkflowAiAnalysis): WorkflowSuggestion[] {
  return analysis.suggestions.map((suggestion) => ({
    id: suggestion.id,
    rule: RULE_BY_KIND[suggestion.kind],
    title: suggestion.title,
    reason: suggestion.reason,
    target: suggestion.target ?? null,
    ...(suggestion.change && { change: suggestion.change }),
    source: "ai",
  }));
}

/* ---------- RF-17: flujo propuesto desde una descripción ---------- */

export type GeneratedWorkflow = {
  summary: string;
  states: { id: string; name: string; kind: string }[];
  transitions: { id: string; from: string; to: string; label: string; role: string }[];
};

export type WorkflowGeneration = {
  aiAvailable: boolean;
  aiUnavailableReason: AiUnavailableReason | null;
  aiRetryAt: string | null;
  /** Se quitaron correos o números largos antes de enviar la descripción. */
  redacted: boolean;
  provider: string;
  promptVersion: string | null;
  latencyMs: number;
  /** `null` si la IA no está disponible o lo que propuso no se podía usar. */
  workflow: GeneratedWorkflow | null;
};

/** Mismo filtro que el back (para avisar antes de enviar): correos y números largos. */
export function hasPersonalData(text: string) {
  return /[\w.+-]+@[\w-]+(\.[\w-]+)+/.test(text) || /\+?\d[\d\s().-]{5,}\d/.test(text);
}
