import { useState } from "react";
import { Badge, type BadgeTone, Button } from "@/shared/ui";
import type { ElementoDesigner } from "../../designer/types";
import { describeChange, FIELD_TYPE_NAMES } from "../lib/designerChanges";
import { assistantService } from "../services/assistantService";
import type {
  DesignerAnalysis,
  DesignerChange,
  DesignerFieldType,
  DesignerSuggestion,
  SuggestionDecision,
  SuggestionKind,
} from "../types";

// US15-US17 - Emiliano Carrizales: asistente de diseño del Designer.
// TODO(US18 - Karla Alessandra): revisar los mensajes cuando la IA no está disponible.

const KIND: Record<SuggestionKind, { label: string; tone: BadgeTone }> = {
  inconsistency: { label: "Inconsistencia", tone: "amber" },
  component: { label: "Componente", tone: "blue" },
  field: { label: "Campo sugerido", tone: "green" },
};

const DECISION_TEXT: Record<SuggestionDecision, string> = {
  accepted: "Aceptada: se aplicó al formulario. Revisa y guarda.",
  replaced: "Reemplazada: se aplicó tu versión. Revisa y guarda.",
  rejected: "Rechazada: no se cambió nada.",
};

const TYPE_OPTIONS = Object.entries(FIELD_TYPE_NAMES) as [DesignerFieldType, string][];

type DesignerAssistantPanelProps = {
  appId: string;
  elements: readonly ElementoDesigner[];
  hasUnsavedChanges: boolean;
  /** Aplica el cambio al formulario en pantalla (no lo guarda). Lanza error si no se puede. */
  onApplyChange: (change: DesignerChange) => void;
  onFocusField: (fieldId: string) => void;
};

export function DesignerAssistantPanel({
  appId,
  elements,
  hasUnsavedChanges,
  onApplyChange,
  onFocusField,
}: DesignerAssistantPanelProps) {
  const [analysis, setAnalysis] = useState<DesignerAnalysis>();
  const [decisions, setDecisions] = useState<Record<string, SuggestionDecision>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>();

  async function analyze() {
    setAnalyzing(true);
    setError(undefined);
    try {
      setAnalysis(await assistantService.analyzeDesigner(appId));
      setDecisions({});
    } catch {
      // US18: si el asistente falla, el Designer sigue funcionando de forma manual.
      setError("El asistente no está disponible en este momento. Puedes seguir editando el formulario manualmente.");
    } finally {
      setAnalyzing(false);
    }
  }

  function decide(suggestion: DesignerSuggestion, decision: SuggestionDecision, change?: DesignerChange) {
    setError(undefined);
    try {
      if (change) onApplyChange(change);
      setDecisions((current) => ({ ...current, [suggestion.id]: decision }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo aplicar la sugerencia.");
    }
  }

  const pending = analysis?.suggestions.filter((suggestion) => !decisions[suggestion.id]).length ?? 0;

  return (
    <div aria-label="Asistente de diseño">
      <div className="border-b border-line pb-4">
        <div className="text-label font-semibold uppercase text-muted">Asistente de diseño</div>
        <p className="mt-1 text-body-sm text-muted">
          Revisa el formulario guardado y propone mejoras. Nada se aplica sin tu aprobación.
        </p>
        <Button className="mt-3 w-full" variant="primary" onClick={analyze} disabled={analyzing || hasUnsavedChanges}>
          {analyzing ? "Analizando..." : analysis ? "Volver a analizar" : "Analizar formulario"}
        </Button>
        {hasUnsavedChanges && (
          <p className="mt-2 text-label text-muted">Guarda los cambios del formulario para analizar lo que ves.</p>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-md border border-red-line bg-red-bg px-3 py-2 text-body-sm text-red">
          {error}
        </div>
      )}

      {analysis && (
        <div className="py-3">
          {!analysis.aiAvailable && (
            <div
              role="status"
              className="mb-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-body-sm text-amber"
            >
              La IA no está disponible. Se muestran solo las revisiones automáticas.
            </div>
          )}
          <p className="mb-3 text-label text-muted">
            {analysis.suggestions.length === 0
              ? "No se encontraron mejoras para este formulario."
              : `${analysis.suggestions.length} sugerencias · ${pending} pendientes`}
          </p>
          <ul className="space-y-3">
            {analysis.suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                elements={elements}
                decision={decisions[suggestion.id]}
                onAccept={() => decide(suggestion, "accepted", suggestion.change)}
                onReplace={(change) => decide(suggestion, "replaced", change)}
                onReject={() => decide(suggestion, "rejected")}
                onFocusField={onFocusField}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionItem({
  suggestion,
  elements,
  decision,
  onAccept,
  onReplace,
  onReject,
  onFocusField,
}: {
  suggestion: DesignerSuggestion;
  elements: readonly ElementoDesigner[];
  decision?: SuggestionDecision;
  onAccept: () => void;
  onReplace: (change: DesignerChange) => void;
  onReject: () => void;
  onFocusField: (fieldId: string) => void;
}) {
  const [draft, setDraft] = useState<DesignerChange>();
  const kind = KIND[suggestion.kind];

  return (
    <li
      aria-label={suggestion.title}
      className={`rounded-md border border-line bg-surface p-3 ${decision ? "opacity-70" : ""}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={kind.tone} size="sm">
          {kind.label}
        </Badge>
        <Badge size="sm">{suggestion.source === "ai" ? "IA" : "Regla"}</Badge>
        <span className="text-label text-muted">Confianza {suggestion.confidence}</span>
      </div>
      <h3 className="text-body-sm font-semibold text-ink">{suggestion.title}</h3>
      <p className="mt-1 text-body-sm text-ink-2">
        <span className="font-medium">Por qué: </span>
        {suggestion.reason}
      </p>
      {suggestion.change && (
        <p className="mt-2 rounded border border-line-2 bg-nav px-2 py-1.5 text-label text-ink-2">
          Cambio propuesto: {describeChange(suggestion.change, elements)}
        </p>
      )}

      {decision ? (
        <p role="status" className="mt-2 text-label font-medium text-muted">
          {DECISION_TEXT[decision]}
        </p>
      ) : draft ? (
        <ChangeEditor
          change={draft}
          onChange={setDraft}
          onCancel={() => setDraft(undefined)}
          onApply={() => onReplace(draft)}
        />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestion.change ? (
            <>
              <Button size="sm" variant="primary" onClick={onAccept}>
                Aceptar
              </Button>
              <Button size="sm" onClick={() => setDraft(suggestion.change)}>
                Reemplazar
              </Button>
            </>
          ) : (
            suggestion.fieldId && (
              <Button size="sm" onClick={() => onFocusField(suggestion.fieldId as string)}>
                Ir al campo
              </Button>
            )
          )}
          <Button size="sm" onClick={onReject}>
            Rechazar
          </Button>
        </div>
      )}
    </li>
  );
}

/** US17 "reemplazar": el usuario ajusta el cambio propuesto antes de aplicarlo. */
function ChangeEditor({
  change,
  onChange,
  onCancel,
  onApply,
}: {
  change: DesignerChange;
  onChange: (change: DesignerChange) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const inputClass = "mt-1 w-full rounded border border-line-2 px-2 py-1.5 text-body-sm";
  const typeSelect = (type: DesignerFieldType, update: (type: DesignerFieldType) => void) => (
    <label className="block text-label text-ink-2">
      Tipo de campo
      <select className={inputClass} value={type} onChange={(event) => update(event.target.value as DesignerFieldType)}>
        {TYPE_OPTIONS.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
  const textInput = (name: string, value: string, update: (value: string) => void) => (
    <label className="block text-label text-ink-2">
      {name}
      <input className={inputClass} value={value} onChange={(event) => update(event.target.value)} />
    </label>
  );

  const missingLabel = (change.op === "rename-field" || change.op === "add-field") && !change.label.trim();
  const missingFormula = change.op === "set-formula" && !change.formula.trim();
  const valid = !missingLabel && !missingFormula;

  return (
    <div className="mt-3 space-y-2 rounded border border-accent-line bg-accent-bg p-2">
      {change.op === "change-field-type" && typeSelect(change.type, (type) => onChange({ ...change, type }))}
      {change.op === "rename-field" && textInput("Etiqueta", change.label, (label) => onChange({ ...change, label }))}
      {change.op === "set-formula" &&
        textInput("Fórmula", change.formula, (formula) => onChange({ ...change, formula }))}
      {change.op === "set-required" && (
        <label className="flex items-center gap-2 text-label text-ink-2">
          <input
            type="checkbox"
            checked={change.required}
            onChange={(event) => onChange({ ...change, required: event.target.checked })}
          />
          Obligatorio
        </label>
      )}
      {change.op === "add-field" && (
        <>
          {textInput("Etiqueta", change.label, (label) => onChange({ ...change, label }))}
          {typeSelect(change.type, (type) => onChange({ ...change, type }))}
        </>
      )}
      <div className="flex gap-2">
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
