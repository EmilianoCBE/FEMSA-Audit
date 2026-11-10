import { type ReactNode, useState } from "react";
import { Badge, type BadgeTone, Button, InspectorHeader, InspectorSection } from "@/shared/ui";
import {
  describeWorkflowChange,
  WORKFLOW_ROLES,
  type WorkflowChange,
  type WorkflowRuleId,
  type WorkflowSuggestion,
} from "../../lib/workflowAssistant";
import { AiStatusNotice } from "@/features/app-builder/assistant/components/AiStatusNotice";
import { SuggestionList } from "@/features/app-builder/assistant/components/SuggestionList";
import { aiUnavailableMessage } from "@/features/app-builder/assistant/lib/aiAvailability";
import { sortByPriority } from "@/features/app-builder/assistant/lib/suggestionList";
import type { WorkflowAiAnalysis } from "../../lib/workflowAi";
import type { WorkflowDiagram } from "../../types";

// US15-US18 - Emiliano Carrizales: asistente de diseño del workflow. Las revisiones son reglas (US16), cada
// propuesta se acepta, rechaza o reemplaza (US17) y el flujo sigue editable aunque la IA no esté disponible (US18).

export type WorkflowDecision = "accepted" | "replaced" | "rejected";

const RULE: Record<WorkflowRuleId, { label: string; tone: BadgeTone }> = {
  "unreachable-state": { label: "Estado inalcanzable", tone: "amber" },
  "dead-end-state": { label: "Sin salida", tone: "amber" },
  "missing-final-state": { label: "Sin estado final", tone: "amber" },
  "transition-without-role": { label: "Sin rol", tone: "amber" },
  "duplicate-transition": { label: "Duplicada", tone: "amber" },
  "cycle-without-exit": { label: "Ciclo sin salida", tone: "amber" },
  "missing-initial-state": { label: "Sin estado inicial", tone: "amber" },
  "multiple-initial-states": { label: "Varios iniciales", tone: "amber" },
  "exit-from-final-state": { label: "Sale de un final", tone: "amber" },
  "segregation-of-duties": { label: "Segregación de funciones", tone: "amber" },
  "return-without-comment": { label: "Control", tone: "blue" },
  "close-without-evidence": { label: "Control", tone: "blue" },
  "ai-relation": { label: "Relación sugerida", tone: "blue" },
  "ai-role": { label: "Rol sugerido", tone: "blue" },
  "ai-observation": { label: "Observación", tone: "amber" },
};

/** Primero lo que impide que el flujo termine; al final lo que solo lo hace ambiguo. */
const RULE_PRIORITY: Record<WorkflowRuleId, number> = {
  "missing-initial-state": 0,
  "missing-final-state": 0,
  "multiple-initial-states": 1,
  "unreachable-state": 2,
  "dead-end-state": 3,
  "cycle-without-exit": 4,
  "exit-from-final-state": 5,
  "transition-without-role": 6,
  "segregation-of-duties": 7,
  "duplicate-transition": 8,
  // Buenas prácticas de control: importantes, pero el flujo ya funciona sin ellas.
  "return-without-comment": 9,
  "close-without-evidence": 10,
  // Después de las reglas, lo que propone la IA.
  "ai-relation": 11,
  "ai-role": 12,
  "ai-observation": 13,
};

const DECISION_LABEL: Record<WorkflowDecision, string> = {
  accepted: "Aceptada",
  replaced: "Reemplazada",
  rejected: "Rechazada",
};

const DECISION_TEXT: Record<WorkflowDecision, string> = {
  accepted: "Aceptada: se aplicó al flujo.",
  replaced: "Reemplazada: se aplicó tu versión.",
  rejected: "Rechazada: no se cambió nada.",
};

type DesignAssistantPanelProps = {
  diagram: WorkflowDiagram;
  suggestions: readonly WorkflowSuggestion[];
  decisions: Readonly<Record<string, WorkflowDecision>>;
  onDecide: (suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) => void;
  onReanalyze: () => void;
  /** US15 (RF-17/RF-18): sugerencias de la IA para el flujo, a pedido. */
  ai: WorkflowAiPanelState;
  /** Sin permiso de edición se ven las revisiones, pero no se pueden aplicar. */
  readOnly?: boolean;
  /** El flujo se editó a mano desde la última revisión: la lista puede estar desactualizada. */
  stale?: boolean;
  /** Fase 3: generar un flujo (arriba) y métricas / aviso de registro (abajo). */
  header?: ReactNode;
  footer?: ReactNode;
};

export type WorkflowAiPanelState = {
  analyzing: boolean;
  analysis?: WorkflowAiAnalysis;
  /** La petición ni siquiera respondió (sin red, servidor caído, tiempo agotado). */
  error?: string;
  onAsk: () => void;
};

export function DesignAssistantPanel({
  diagram,
  suggestions,
  decisions,
  onDecide,
  onReanalyze,
  ai,
  readOnly = false,
  stale = false,
  header,
  footer,
}: DesignAssistantPanelProps) {
  const [announcement, setAnnouncement] = useState<string>();
  const sorted = sortByPriority(suggestions, (suggestion) => RULE_PRIORITY[suggestion.rule]);
  const decide = (suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) => {
    onDecide(suggestion, decision, change);
    setAnnouncement(`${DECISION_TEXT[decision]} — ${suggestion.title}`);
  };

  return (
    <section aria-label="Asistente de diseño del flujo">
      <InspectorHeader eyebrow="Asistente de diseño" title="Revisión del flujo" />
      {header}
      <InspectorSection>
        <p className="text-meta/[1.45] text-muted">
          Las reglas revisan que el flujo pueda terminar (estados inalcanzables, sin salida, ciclos), quién ejecuta cada
          paso (roles y segregación de funciones) y los controles (comentario al devolver, evidencia al cerrar). La IA
          sugiere relaciones y roles que faltan. Nada se aplica sin tu aprobación.
        </p>
        <div className="mt-2.5 flex gap-2">
          <Button className="flex-1" variant="primary" size="sm" onClick={ai.onAsk} disabled={ai.analyzing}>
            {ai.analyzing
              ? "Consultando a la IA…"
              : ai.analysis
                ? "Volver a preguntar a la IA"
                : "Pedir sugerencias a la IA"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAnnouncement(undefined);
              onReanalyze();
            }}
          >
            Volver a analizar
          </Button>
        </div>
        <p className="mt-1.5 text-label text-muted">
          A la IA solo se envía la estructura del flujo: estados, transiciones y roles.
        </p>
        {/* US18: antes de preguntar se ve si la IA está disponible; después, el resultado de la consulta. */}
        {!ai.analysis && !ai.error && <AiStatusNotice />}
        {ai.error && (
          <div
            role="alert"
            className="mt-2.5 rounded-md border border-red-line bg-red-bg px-3 py-2 text-meta/[1.45] text-red"
          >
            {ai.error}
          </div>
        )}
        {ai.analysis && !ai.analysis.aiAvailable && (
          <div
            role="status"
            aria-label="Estado de la IA"
            className="mt-2.5 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-meta/[1.45] text-amber"
          >
            {aiUnavailableMessage(ai.analysis.aiUnavailableReason, ai.analysis.aiRetryAt)}
          </div>
        )}
        {ai.analysis?.aiAvailable && ai.analysis.suggestions.length === 0 && (
          <p role="status" className="mt-2.5 text-label text-muted">
            La IA no encontró mejoras adicionales para este flujo.
          </p>
        )}
      </InspectorSection>
      <div className="px-4 py-3.5">
        {stale && (
          <p
            role="status"
            className="mb-2.5 rounded-md border border-amber-line bg-amber-bg px-2.5 py-1.5 text-label text-amber"
          >
            Editaste el flujo desde la última revisión. «Volver a analizar» actualiza la lista.
          </p>
        )}
        <SuggestionList
          key={suggestions.map((suggestion) => suggestion.id).join()}
          items={sorted}
          decisions={decisions}
          announcement={announcement}
          emptyText="No se encontraron inconsistencias en este flujo."
          getTitle={(suggestion) => suggestion.title}
          decisionLabel={(decision) => DECISION_LABEL[decision as WorkflowDecision]}
          renderBadges={(suggestion) => (
            <>
              <Badge tone={RULE[suggestion.rule].tone} size="sm">
                {RULE[suggestion.rule].label}
              </Badge>
              <Badge size="sm">{suggestion.source === "ai" ? "IA" : "Regla"}</Badge>
            </>
          )}
          renderDetails={(suggestion) => (
            <SuggestionDetails
              diagram={diagram}
              suggestion={suggestion}
              readOnly={readOnly}
              onDecide={(decision, change) => decide(suggestion, decision, change)}
            />
          )}
        />
        {footer}
      </div>
    </section>
  );
}

/** Lo que se ve al abrir una tarjeta: por qué, el cambio propuesto y las acciones (US17). */
function SuggestionDetails({
  diagram,
  suggestion,
  readOnly,
  onDecide,
}: {
  diagram: WorkflowDiagram;
  suggestion: WorkflowSuggestion;
  readOnly: boolean;
  onDecide: (decision: WorkflowDecision, change?: WorkflowChange) => void;
}) {
  const [draft, setDraft] = useState<WorkflowChange>();
  // Reemplazar = elegir otro rol, origen o destino; quitar una transición o exigir un requisito solo se acepta o rechaza.
  const editable = suggestion.change?.op === "set-transition-role" || suggestion.change?.op === "add-transition";

  return (
    <>
      <p className="text-meta/[1.45] text-ink-2">
        <span className="font-medium">Por qué: </span>
        {suggestion.reason}
      </p>
      {suggestion.change && (
        <p className="mt-2 rounded border border-line-2 bg-nav px-2 py-1.5 text-label text-ink-2">
          Cambio propuesto: {describeWorkflowChange(diagram, suggestion.change)}
        </p>
      )}

      {readOnly ? (
        <p className="mt-2 text-label text-muted">Solo lectura: tu rol no puede aplicar cambios al flujo.</p>
      ) : draft ? (
        <ChangeEditor
          diagram={diagram}
          change={draft}
          onChange={setDraft}
          onCancel={() => setDraft(undefined)}
          onApply={() => onDecide("replaced", draft)}
        />
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestion.change && (
            <Button variant="primary" size="sm" onClick={() => onDecide("accepted", suggestion.change)}>
              Aceptar
            </Button>
          )}
          {editable && (
            <Button size="sm" onClick={() => setDraft(suggestion.change)}>
              Reemplazar
            </Button>
          )}
          <Button size="sm" onClick={() => onDecide("rejected")}>
            Rechazar
          </Button>
        </div>
      )}
    </>
  );
}

/** US17 "reemplazar": el usuario elige otro rol, origen o destino antes de aplicar. */
function ChangeEditor({
  diagram,
  change,
  onChange,
  onCancel,
  onApply,
}: {
  diagram: WorkflowDiagram;
  change: WorkflowChange;
  onChange: (change: WorkflowChange) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const inputClass = "mt-1 w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm";
  const select = (
    name: string,
    value: string,
    options: readonly { value: string; label: string }[],
    update: (value: string) => void,
  ) => (
    <label className="block text-label text-ink-2">
      {name}
      <select className={inputClass} value={value} onChange={(event) => update(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
  const roles = WORKFLOW_ROLES.map((role) => ({ value: role, label: role }));
  const states = diagram.states.map((state) => ({ value: state.id, label: state.name }));
  const valid = change.op !== "add-transition" || (change.label.trim().length > 0 && change.from !== change.to);

  return (
    <div className="mt-2 space-y-2 rounded border border-accent-line bg-accent-bg p-2">
      {change.op === "set-transition-role" &&
        select("Rol", change.role, roles, (role) => onChange({ ...change, role }))}
      {change.op === "add-transition" && (
        <>
          {select("Desde", change.from, states, (from) => onChange({ ...change, from }))}
          {select("Hacia", change.to, states, (to) => onChange({ ...change, to }))}
          <label className="block text-label text-ink-2">
            Acción
            <input
              className={inputClass}
              value={change.label}
              onChange={(event) => onChange({ ...change, label: event.target.value })}
            />
          </label>
          {select("Rol", change.role, roles, (role) => onChange({ ...change, role }))}
        </>
      )}
      <div className="flex gap-1.5">
        <Button size="sm" variant="primary" onClick={onApply} disabled={!valid}>
          Aplicar mi versión
        </Button>
        <Button size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
