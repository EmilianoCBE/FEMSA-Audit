import { useState } from "react";
import { Badge, type BadgeTone, Button, FilterChip } from "@/shared/ui";
import type { ElementoDesigner } from "../../designer/types";
import { ANALYZE_TIMEOUT_MS, aiUnavailableMessage, assistantErrorMessage } from "../lib/aiAvailability";
import { describeChange, FIELD_TYPE_NAMES } from "../lib/designerChanges";
import { sortByPriority } from "../lib/suggestionList";
import { assistantService } from "../services/assistantService";
import { AiStatusNotice } from "./AiStatusNotice";
import { AssistantMetrics } from "./AssistantMetrics";
import { SuggestionList } from "./SuggestionList";
import type {
  DesignerAnalysis,
  DesignerChange,
  DesignerFieldType,
  DesignerSuggestion,
  SuggestionDecision,
  SuggestionKind,
} from "../types";

// US15-US17 - Emiliano Carrizales: asistente de diseño del Designer.
// US18 - Karla Alessandra (implementación inicial: Emiliano): sin IA, el panel lo avisa desde que se abre, dice por qué
// y el Designer sigue funcionando de forma manual.

const KIND: Record<SuggestionKind, { label: string; tone: BadgeTone }> = {
  inconsistency: { label: "Inconsistencia", tone: "amber" },
  component: { label: "Componente", tone: "blue" },
  field: { label: "Campo sugerido", tone: "green" },
};

/** Primero lo que está mal, luego cambios de componente y al final campos nuevos; dentro, la más confiable. */
const KIND_PRIORITY: Record<SuggestionKind, number> = { inconsistency: 0, component: 1, field: 2 };
const CONFIDENCE_PRIORITY = { alta: 0, media: 1, baja: 2 } as const;
const priority = (suggestion: DesignerSuggestion) =>
  KIND_PRIORITY[suggestion.kind] * 10 + CONFIDENCE_PRIORITY[suggestion.confidence];

type SourceFilter = "all" | "rules" | "ai";

const DECISION_LABEL: Record<SuggestionDecision, string> = {
  accepted: "Aceptada",
  replaced: "Reemplazada",
  rejected: "Rechazada",
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
  const [notRecorded, setNotRecorded] = useState(false);
  const [metricsVersion, setMetricsVersion] = useState(0);
  const [announcement, setAnnouncement] = useState<string>();
  const [source, setSource] = useState<SourceFilter>("all");
  const refreshMetrics = () => setMetricsVersion((version) => version + 1);

  async function analyze() {
    setAnalyzing(true);
    setError(undefined);
    try {
      setAnalysis(await assistantService.analyzeDesigner(appId, AbortSignal.timeout(ANALYZE_TIMEOUT_MS)));
      setDecisions({});
      setAnnouncement(undefined);
      setSource("all");
      setNotRecorded(false);
      refreshMetrics();
    } catch (reason) {
      // US18: si el asistente falla, el Designer sigue funcionando de forma manual.
      setError(assistantErrorMessage(reason));
    } finally {
      setAnalyzing(false);
    }
  }

  function decide(suggestion: DesignerSuggestion, decision: SuggestionDecision, change?: DesignerChange) {
    setError(undefined);
    try {
      if (change) onApplyChange(change);
      setDecisions((current) => ({ ...current, [suggestion.id]: decision }));
      setAnnouncement(`${DECISION_TEXT[decision]} — ${suggestion.title}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo aplicar la sugerencia.");
      return;
    }
    // Registrar la decisión no bloquea al usuario: el cambio ya quedó aplicado en pantalla.
    if (analysis?.recorded) {
      assistantService
        .decide(suggestion.id, decision, change)
        .then(refreshMetrics)
        .catch(() => setNotRecorded(true));
    }
  }

  const suggestions = sortByPriority(analysis?.suggestions ?? [], priority);
  const pendingBySource = (wanted: SourceFilter) =>
    suggestions.filter((s) => !decisions[s.id] && (wanted === "all" || s.source === wanted)).length;
  const hasBothSources = suggestions.some((s) => s.source === "ai") && suggestions.some((s) => s.source === "rules");
  const shown = hasBothSources && source !== "all" ? suggestions.filter((s) => s.source === source) : suggestions;

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
        {/* RNF-13: las etiquetas son texto libre y sí llegan a la IA. */}
        <p className="mt-2 text-label text-muted">
          A la IA solo se envía la estructura del formulario (tipos, etiquetas, secciones). No escribas datos personales
          en las etiquetas.
        </p>
        {/* Después de analizar, el aviso del análisis reemplaza a este (es más reciente). */}
        {!analysis && <AiStatusNotice />}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-md border border-red-line bg-red-bg px-3 py-2 text-body-sm text-red">
          {error}
        </div>
      )}

      {notRecorded && (
        <p role="status" className="mt-3 text-label text-muted">
          No se pudo registrar alguna decisión en el historial del asistente; tus cambios en el formulario no se
          afectan.
        </p>
      )}

      {analysis && (
        <div className="py-3">
          {!analysis.aiAvailable && (
            <div
              role="status"
              className="mb-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-body-sm text-amber"
            >
              {aiUnavailableMessage(analysis.aiUnavailableReason, analysis.aiRetryAt)}
            </div>
          )}
          {hasBothSources && (
            <fieldset className="mb-2.5 flex flex-wrap gap-1.5">
              <legend className="sr-only">Mostrar sugerencias de</legend>
              {(
                [
                  ["all", "Todas"],
                  ["rules", "Reglas"],
                  ["ai", "IA"],
                ] as const
              ).map(([value, label]) => (
                <FilterChip
                  key={value}
                  selected={source === value}
                  className="px-2 py-1 text-label"
                  onClick={() => setSource(value)}
                >
                  {label} ({pendingBySource(value)})
                </FilterChip>
              ))}
            </fieldset>
          )}
          <SuggestionList
            key={`${suggestions.map((s) => s.id).join()}-${source}`}
            items={shown}
            decisions={decisions}
            announcement={announcement}
            emptyText="No se encontraron mejoras para este formulario."
            getTitle={(suggestion) => suggestion.title}
            decisionLabel={(decision) => DECISION_LABEL[decision as SuggestionDecision]}
            renderBadges={(suggestion) => (
              <>
                <Badge tone={KIND[suggestion.kind].tone} size="sm">
                  {KIND[suggestion.kind].label}
                </Badge>
                <Badge size="sm">{suggestion.source === "ai" ? "IA" : "Regla"}</Badge>
              </>
            )}
            renderDetails={(suggestion) => (
              <SuggestionDetails
                suggestion={suggestion}
                elements={elements}
                onAccept={() => decide(suggestion, "accepted", suggestion.change)}
                onReplace={(change) => decide(suggestion, "replaced", change)}
                onReject={() => decide(suggestion, "rejected")}
                onFocusField={onFocusField}
              />
            )}
          />
        </div>
      )}

      <AssistantMetrics appId={appId} refreshKey={metricsVersion} />
    </div>
  );
}

/** Lo que se ve al abrir una tarjeta: por qué, el cambio propuesto y las acciones (US17). */
function SuggestionDetails({
  suggestion,
  elements,
  onAccept,
  onReplace,
  onReject,
  onFocusField,
}: {
  suggestion: DesignerSuggestion;
  elements: readonly ElementoDesigner[];
  onAccept: () => void;
  onReplace: (change: DesignerChange) => void;
  onReject: () => void;
  onFocusField: (fieldId: string) => void;
}) {
  const [draft, setDraft] = useState<DesignerChange>();

  return (
    <>
      <p className="text-body-sm text-ink-2">
        <span className="font-medium">Por qué: </span>
        {suggestion.reason}
      </p>
      <p className="mt-1 text-label text-muted">Confianza {suggestion.confidence}</p>
      {suggestion.change && (
        <p className="mt-2 rounded border border-line-2 bg-nav px-2 py-1.5 text-label text-ink-2">
          Cambio propuesto: {describeChange(suggestion.change, elements)}
        </p>
      )}

      {draft ? (
        <ChangeEditor
          change={draft}
          onChange={setDraft}
          onCancel={() => setDraft(undefined)}
          onApply={() => onReplace(draft)}
        />
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {suggestion.change && (
            <>
              <Button size="sm" variant="primary" onClick={onAccept}>
                Aceptar
              </Button>
              <Button size="sm" onClick={() => setDraft(suggestion.change)}>
                Reemplazar
              </Button>
            </>
          )}
          {suggestion.fieldId && !suggestion.change && (
            <Button size="sm" onClick={() => onFocusField(suggestion.fieldId as string)}>
              Ir al campo
            </Button>
          )}
          <Button size="sm" onClick={onReject}>
            Rechazar
          </Button>
        </div>
      )}
    </>
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
