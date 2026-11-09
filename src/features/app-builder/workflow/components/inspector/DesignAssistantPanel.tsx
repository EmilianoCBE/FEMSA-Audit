import { useState } from "react";
import { Badge, type BadgeTone, Button, InspectorHeader, InspectorSection } from "@/shared/ui";
import {
  describeWorkflowChange,
  WORKFLOW_ROLES,
  type WorkflowChange,
  type WorkflowRuleId,
  type WorkflowSuggestion,
} from "../../lib/workflowAssistant";
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
};

export function DesignAssistantPanel({
  diagram,
  suggestions,
  decisions,
  onDecide,
  onReanalyze,
}: DesignAssistantPanelProps) {
  const pending = suggestions.filter((suggestion) => !decisions[suggestion.id]).length;

  return (
    <section aria-label="Asistente de diseño del flujo">
      <InspectorHeader eyebrow="Asistente de diseño" title="Revisión del flujo" />
      <InspectorSection>
        <div
          role="status"
          className="rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-meta/[1.45] text-amber"
        >
          La IA no está disponible para el flujo. Se muestran las revisiones automáticas y puedes seguir editando de
          forma manual.
        </div>
        <p className="mt-2 text-meta/[1.45] text-muted">
          Revisa estados inalcanzables, estados sin salida, ciclos sin salida, transiciones sin rol y duplicadas. Nada
          se aplica sin tu aprobación.
        </p>
        <Button className="mt-2.5 w-full" size="sm" onClick={onReanalyze}>
          Volver a analizar
        </Button>
      </InspectorSection>
      <div className="px-4 py-3.5">
        <p className="mb-2.5 text-label text-muted">
          {suggestions.length === 0
            ? "No se encontraron inconsistencias en este flujo."
            : `${suggestions.length} sugerencias · ${pending} pendientes`}
        </p>
        <ul className="space-y-2.5">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              diagram={diagram}
              suggestion={suggestion}
              decision={decisions[suggestion.id]}
              onDecide={(decision, change) => onDecide(suggestion, decision, change)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function SuggestionItem({
  diagram,
  suggestion,
  decision,
  onDecide,
}: {
  diagram: WorkflowDiagram;
  suggestion: WorkflowSuggestion;
  decision?: WorkflowDecision;
  onDecide: (decision: WorkflowDecision, change?: WorkflowChange) => void;
}) {
  const [draft, setDraft] = useState<WorkflowChange>();
  const rule = RULE[suggestion.rule];
  const editable = suggestion.change && suggestion.change.op !== "remove-transition";

  return (
    <li
      aria-label={suggestion.title}
      className={`rounded-md border border-line bg-surface px-[11px] py-2.5 ${decision ? "opacity-70" : ""}`}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={rule.tone} size="sm">
          {rule.label}
        </Badge>
        <Badge size="sm">Regla</Badge>
      </div>
      <h3 className="text-body-sm/[1.35] font-medium">{suggestion.title}</h3>
      <p className="mt-1 text-meta/[1.45] text-ink-2">
        <span className="font-medium">Por qué: </span>
        {suggestion.reason}
      </p>
      {suggestion.change && (
        <p className="mt-2 rounded border border-line-2 bg-nav px-2 py-1.5 text-label text-ink-2">
          Cambio propuesto: {describeWorkflowChange(diagram, suggestion.change)}
        </p>
      )}

      {decision ? (
        <p role="status" className="mt-2 text-label font-medium text-muted">
          {DECISION_TEXT[decision]}
        </p>
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
    </li>
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
