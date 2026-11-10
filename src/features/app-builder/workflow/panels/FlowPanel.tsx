import { useCallback, useMemo, useState } from "react";
import { usePermissions } from "@/features/auth/permissions";
import { ANALYZE_TIMEOUT_MS, assistantErrorMessage } from "@/features/app-builder/assistant/lib/aiAvailability";
import { useQuery } from "@/shared/hooks/useQuery";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { Button, QueryState } from "@/shared/ui";
import { designerService } from "../../designer/services/designerService";
import type { PlantillaDesigner } from "../../designer/types";
import { AssistantBanner } from "../components/AssistantBanner";
import { WorkflowCanvas } from "../components/canvas/WorkflowCanvas";
import type { WorkflowDecision } from "../components/inspector/DesignAssistantPanel";
import { type InspectorView, WorkflowInspector } from "../components/inspector/WorkflowInspector";
import { selectedTransitionMock } from "../data/workflow.mock";
import { buildWorkflowAiRequest, toWorkflowSuggestions, type WorkflowAiAnalysis } from "../lib/workflowAi";
import {
  analyzeWorkflow,
  applyWorkflowChange,
  suggestionWarnings,
  type WorkflowChange,
  type WorkflowSuggestion,
} from "../lib/workflowAssistant";
import { fromStoredWorkflow, sameWorkflow, toStoredWorkflow } from "../lib/workflowStorage";
import { workflowAiService } from "../services/workflowAiService";
import type { StoredWorkflow } from "../types";

// Fase 1 del workflow - Emiliano Carrizales: cada formulario del Designer tiene su flujo. Se guarda con
// "Guardar flujo" y entra en la siguiente versión del formulario (AppVersions.config.workflow, US11).
export function FlowPanel() {
  const query = useQuery(useCallback((signal: AbortSignal) => designerService.listPlantillasDesigner(signal), []));
  const [selectedId, setSelectedId] = useState<string>();
  // Lo guardado en esta sesión, para no volver a pedir la lista después de cada "Guardar flujo".
  const [savedById, setSavedById] = useState<Record<string, PlantillaDesigner>>({});

  return (
    <QueryState query={query}>
      {(plantillas) => {
        const layout = plantillas.find((plantilla) => plantilla.id === selectedId) ?? plantillas[0];
        if (!layout) {
          return (
            <p className="p-4 text-body-sm text-muted">Crea un formulario en el Designer para definir su flujo.</p>
          );
        }
        const current = savedById[layout.id] ?? layout;
        return (
          <WorkflowEditor
            key={layout.id}
            layout={current}
            plantillas={plantillas}
            onSelect={setSelectedId}
            onSaved={(saved) => setSavedById((previous) => ({ ...previous, [saved.id]: saved }))}
          />
        );
      }}
    </QueryState>
  );
}

/** Lo guardado con el trazo ya calculado, para que comparar contra la pantalla no marque cambios que no hubo. */
const normalized = (workflow: StoredWorkflow | null | undefined) =>
  workflow ? toStoredWorkflow(fromStoredWorkflow(workflow)) : null;

type WorkflowEditorProps = {
  layout: PlantillaDesigner;
  plantillas: readonly PlantillaDesigner[];
  onSelect: (id: string) => void;
  onSaved: (layout: PlantillaDesigner) => void;
};

function WorkflowEditor({ layout, plantillas, onSelect, onSaved }: WorkflowEditorProps) {
  const canEdit = usePermissions().permissions["app-builder"] === "edit";
  // Lo último guardado (null = el formulario aún no tiene flujo y se muestra la plantilla base).
  const [saved, setSaved] = useState<StoredWorkflow | null>(() => normalized(layout.workflow));
  const [diagram, setDiagram] = useState(() => fromStoredWorkflow(layout.workflow));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>();

  const [inspectorView, setInspectorView] = useState<InspectorView>("settings");
  // Lista que ve el usuario: se calcula al abrir y al pedir "Volver a analizar", para que las decididas no desaparezcan.
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>(() =>
    analyzeWorkflow(fromStoredWorkflow(layout.workflow)),
  );
  const [decisions, setDecisions] = useState<Record<string, WorkflowDecision>>({});
  // US15: lo que propuso la IA en la última consulta (se pide con un botón, no en cada cambio).
  const [aiAnalysis, setAiAnalysis] = useState<WorkflowAiAnalysis>();
  const [aiSuggestions, setAiSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string>();

  // Las marcas del diagrama y el aviso sí reflejan el flujo actual.
  const current = useMemo(() => analyzeWorkflow(diagram), [diagram]);
  const shown = useMemo(() => ({ ...diagram, warnings: suggestionWarnings(diagram, current) }), [diagram, current]);

  // Sin flujo guardado, la plantilla base cuenta como "sin guardar" para que se pueda guardar tal cual.
  const hasChanges = saved === null || !sameWorkflow(saved, toStoredWorkflow(diagram));
  const unsaved = hasChanges && saved !== null;
  const leave = useUnsavedChangesGuard(unsaved);

  function edit(change: WorkflowChange) {
    setDiagram((previous) => applyWorkflowChange(previous, change));
    setMessage(undefined);
  }

  function decide(suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) {
    if (change) edit(change);
    setDecisions((previous) => ({ ...previous, [suggestion.id]: decision }));
  }

  function reanalyze() {
    setSuggestions(analyzeWorkflow(diagram));
    setDecisions({});
    setAiAnalysis(undefined);
    setAiSuggestions([]);
    setAiError(undefined);
  }

  async function save() {
    if (!canEdit) return false;
    setSaving(true);
    setMessage(undefined);
    try {
      const updated = await designerService.saveWorkflowDesigner(layout.id, toStoredWorkflow(diagram));
      setSaved(normalized(updated.workflow));
      onSaved(updated);
      setMessage({ tone: "ok", text: "Flujo guardado. Se incluirá en la siguiente versión del formulario." });
      return true;
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "No se pudo guardar el flujo." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDiagram(fromStoredWorkflow(saved));
    setMessage(undefined);
  }

  async function askAi() {
    setAiAnalyzing(true);
    setAiError(undefined);
    try {
      // Se manda el flujo como está ahora y lo que ya dicen las reglas, para que la IA no lo repita.
      const analysis = await workflowAiService.analyze(
        buildWorkflowAiRequest(diagram, current),
        AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
      );
      setAiAnalysis(analysis);
      setAiSuggestions(toWorkflowSuggestions(analysis));
    } catch (reason) {
      // US18: sin IA el flujo sigue editable con las reglas.
      setAiError(assistantErrorMessage(reason, "el flujo"));
    } finally {
      setAiAnalyzing(false);
    }
  }

  const status = saved === null ? "Plantilla base: aún no se guarda" : unsaved ? "Cambios sin guardar" : "Guardado";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        aria-label="Flujo del formulario"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-4 py-2.5"
      >
        <label className="flex items-center gap-2 text-body-sm text-ink-2">
          Formulario
          <select
            className="rounded border border-line-2 bg-surface px-2 py-1 text-body-sm"
            value={layout.id}
            disabled={unsaved}
            title={unsaved ? "Guarda o descarta los cambios para cambiar de formulario." : undefined}
            onChange={(event) => onSelect(event.target.value)}
          >
            {plantillas.map((plantilla) => (
              <option key={plantilla.id} value={plantilla.id}>
                {plantilla.name}
              </option>
            ))}
          </select>
        </label>
        <span
          role="status"
          className={`text-label font-medium ${unsaved || saved === null ? "text-amber" : "text-green"}`}
        >
          {status}
        </span>
        {canEdit ? (
          <div className="ml-auto flex gap-2">
            {unsaved && (
              <Button size="sm" onClick={discard} disabled={saving}>
                Descartar cambios
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={save} disabled={saving || !hasChanges}>
              {saving ? "Guardando..." : "Guardar flujo"}
            </Button>
          </div>
        ) : (
          <span className="ml-auto text-label text-muted">Solo lectura: tu rol no puede modificar el flujo.</span>
        )}
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`basis-full text-label ${message.tone === "error" ? "text-red" : "text-green"}`}
          >
            {message.text}
          </p>
        )}
      </section>

      {leave.state === "blocked" && (
        <div
          role="alertdialog"
          aria-label="Cambios sin guardar"
          className="flex flex-wrap items-center gap-2 border-b border-amber-line bg-amber-bg px-4 py-2 text-body-sm text-amber"
        >
          <span className="min-w-0 flex-1">Tienes cambios en el flujo sin guardar. Si sales ahora se perderán.</span>
          <Button size="sm" onClick={() => leave.reset()}>
            Seguir editando
          </Button>
          <Button size="sm" onClick={() => leave.proceed()}>
            Salir sin guardar
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={saving}
            onClick={async () => ((await save()) ? leave.proceed() : leave.reset())}
          >
            Guardar y salir
          </Button>
        </div>
      )}

      <div className="workflow-flow-grid grid min-h-0 flex-1 grid-cols-1 desktop:grid-cols-[1fr_300px]">
        <div className="overflow-auto border-r border-line bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px]">
          <AssistantBanner inconsistencies={current.length} onReview={() => setInspectorView("assistant")} />
          <WorkflowCanvas diagram={shown} />
        </div>
        <WorkflowInspector
          view={inspectorView}
          onViewChange={setInspectorView}
          settings={selectedTransitionMock}
          assistant={{
            diagram,
            suggestions: [...suggestions, ...aiSuggestions],
            decisions,
            onDecide: decide,
            onReanalyze: reanalyze,
            ai: { analyzing: aiAnalyzing, analysis: aiAnalysis, error: aiError, onAsk: askAi },
          }}
        />
      </div>
    </div>
  );
}
