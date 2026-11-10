import { Redo2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { AssistantMetrics } from "@/features/app-builder/assistant/components/AssistantMetrics";
import { ANALYZE_TIMEOUT_MS, assistantErrorMessage } from "@/features/app-builder/assistant/lib/aiAvailability";
import { usePermissions } from "@/features/auth/permissions";
import { useQuery } from "@/shared/hooks/useQuery";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { Button, QueryState } from "@/shared/ui";
import { designerService } from "../../designer/services/designerService";
import type { PlantillaDesigner } from "../../designer/types";
import { AssistantBanner } from "../components/AssistantBanner";
import { type MovePhase, WorkflowCanvas } from "../components/canvas/WorkflowCanvas";
import type { WorkflowDecision } from "../components/inspector/DesignAssistantPanel";
import type { FlowSelection } from "../components/inspector/FlowEditorPanel";
import { type FlowProposal, GenerateFlowSection } from "../components/inspector/GenerateFlowSection";
import { type InspectorView, WorkflowInspector } from "../components/inspector/WorkflowInspector";
import { useUndoable } from "../hooks/useUndoable";
import { buildWorkflowAiRequest, toWorkflowSuggestions, type WorkflowAiAnalysis } from "../lib/workflowAi";
import {
  analyzeWorkflow,
  suggestionWarnings,
  type WorkflowChange,
  type WorkflowSuggestion,
} from "../lib/workflowAssistant";
import { applyWorkflowEdit, type WorkflowEdit } from "../lib/workflowEditing";
import { fromStoredWorkflow, sameWorkflow, toStoredWorkflow } from "../lib/workflowStorage";
import { workflowAiService } from "../services/workflowAiService";
import type { Point, StoredWorkflow, WorkflowDiagram } from "../types";

// Workflow - Emiliano Carrizales.
// Fase 1: cada formulario del Designer tiene su flujo; se guarda con "Guardar flujo" y entra en la siguiente versión
// del formulario (AppVersions.config.workflow, US11).
// Fase 2: el flujo se edita a mano (estados, transiciones, roles, requisitos y plazos), con deshacer / rehacer.
// Fase 3: las decisiones del asistente se registran con métricas, y un flujo se puede proponer desde una descripción
// (RF-17) o una plantilla; nada se aplica sin que el usuario lo acepte.
export function FlowPanel() {
  const query = useQuery(useCallback((signal: AbortSignal) => designerService.listPlantillasDesigner(signal), []));
  // ?layout=<id> abre el flujo de ese formulario (por ejemplo, desde el panel del flujo en el Designer).
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("layout") ?? undefined;
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
            onSelect={(id) => setParams({ layout: id }, { replace: true })}
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

/** ¿El foco está en un campo de texto? (ahí Ctrl+Z deshace el texto, no el flujo). */
const typingIn = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

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
  const history = useUndoable(() => fromStoredWorkflow(layout.workflow));
  const diagram = history.value;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string }>();

  // Fase 2: selección, acomodo y zoom del diagrama.
  const [selection, setSelection] = useState<FlowSelection>(null);
  const [zoom, setZoom] = useState(1);
  const dragStart = useRef<WorkflowDiagram | null>(null);
  // Fase 3: propuesta (IA o plantilla) que se ve antes de aplicarla.
  const [proposal, setProposal] = useState<FlowProposal>();

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
  // Fase 3: se vuelven a pedir las métricas después de cada decisión registrada.
  const [metricsKey, setMetricsKey] = useState(0);
  const [recordNote, setRecordNote] = useState<string>();
  // La lista del asistente es una foto: se avisa cuando el flujo se editó a mano después de tomarla.
  const [stale, setStale] = useState(false);

  // Las marcas del diagrama y el aviso sí reflejan el flujo actual.
  const current = useMemo(() => analyzeWorkflow(diagram), [diagram]);
  const shown = useMemo(() => ({ ...diagram, warnings: suggestionWarnings(diagram, current) }), [diagram, current]);

  // Sin flujo guardado, la plantilla base cuenta como "sin guardar" para que se pueda guardar tal cual.
  const hasChanges = saved === null || !sameWorkflow(saved, toStoredWorkflow(diagram));
  const unsaved = hasChanges && saved !== null;
  const leave = useUnsavedChangesGuard(unsaved);

  const edit = useCallback(
    (change: WorkflowEdit) => {
      if (!canEdit) return;
      history.commit((previous) => applyWorkflowEdit(previous, change));
      setMessage(undefined);
    },
    [canEdit, history.commit],
  );

  function moveState(stateId: string, position: Point, phase: MovePhase) {
    if (!canEdit) return;
    const move = (previous: WorkflowDiagram) => applyWorkflowEdit(previous, { op: "move-state", stateId, position });
    if (phase === "key") {
      history.commit(move);
      return;
    }
    // Al arrastrar, el historial guarda una sola entrada: cómo estaba antes de empezar.
    if (!dragStart.current) dragStart.current = diagram;
    history.preview(move);
    if (phase === "end") {
      history.checkpoint(dragStart.current);
      dragStart.current = null;
    }
  }

  // Ctrl/Cmd+Z deshace y Ctrl/Cmd+Shift+Z (o Ctrl+Y) rehace, salvo que se esté escribiendo en un campo.
  const { undo, redo } = history;
  useEffect(() => {
    if (!canEdit) return;
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || typingIn(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) undo();
      else if ((key === "z" && event.shiftKey) || key === "y") redo();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit, undo, redo]);

  /** Fase 3 (US17): la decisión se registra en el back; si no se puede, el cambio igual queda en el flujo. */
  function record(suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) {
    let request: Promise<unknown> | undefined;
    if (suggestion.source !== "ai") request = workflowAiService.decideRule(layout.id, suggestion, decision, change);
    else if (aiAnalysis?.recorded) request = workflowAiService.decideAi(suggestion.id, decision, change);
    request
      ?.then(() => {
        setRecordNote(undefined);
        setMetricsKey((key) => key + 1);
      })
      .catch(() =>
        setRecordNote("No se pudo registrar la decisión para las métricas; el cambio sí se aplicó al flujo."),
      );
  }

  function decide(suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) {
    if (!canEdit) return;
    if (change) edit(change);
    setDecisions((previous) => ({ ...previous, [suggestion.id]: decision }));
    record(suggestion, decision, change);
  }

  function reanalyze() {
    setStale(false);
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
    history.reset(fromStoredWorkflow(saved));
    setSelection(null);
    setMessage(undefined);
  }

  function applyProposal() {
    if (!proposal) return;
    const next = proposal.diagram;
    history.commit(() => next);
    setProposal(undefined);
    setSelection(null);
    setStale(false);
    setSuggestions(analyzeWorkflow(next));
    setDecisions({});
    setAiAnalysis(undefined);
    setAiSuggestions([]);
    setAiError(undefined);
    setMessage({
      tone: "ok",
      text: "Se aplicó la propuesta. Revisa lo que dice el asistente, ajústala y guarda el flujo (puedes deshacer).",
    });
  }

  async function askAi() {
    setAiAnalyzing(true);
    setAiError(undefined);
    try {
      // Se manda el flujo como está ahora y lo que ya dicen las reglas, para que la IA no lo repita.
      const analysis = await workflowAiService.analyze(
        buildWorkflowAiRequest(diagram, current, layout.id),
        AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
      );
      setAiAnalysis(analysis);
      setAiSuggestions(toWorkflowSuggestions(analysis));
      if (analysis.recorded) setMetricsKey((key) => key + 1);
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
            <Button
              size="sm"
              aria-label="Deshacer"
              title="Deshacer (Ctrl+Z)"
              onClick={undo}
              disabled={!history.canUndo}
            >
              <Undo2 aria-hidden size={14} />
            </Button>
            <Button
              size="sm"
              aria-label="Rehacer"
              title="Rehacer (Ctrl+Shift+Z)"
              onClick={redo}
              disabled={!history.canRedo}
            >
              <Redo2 aria-hidden size={14} />
            </Button>
            {unsaved && (
              <Button size="sm" onClick={discard} disabled={saving}>
                Descartar cambios
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={save} disabled={saving || !hasChanges || Boolean(proposal)}>
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

      {proposal && (
        <section
          aria-label="Propuesta de flujo"
          className="flex flex-wrap items-center gap-2 border-b border-accent-line bg-accent-bg px-4 py-2.5 text-body-sm text-ink-2"
        >
          <span className="min-w-0 flex-1">
            <span className="font-semibold text-accent">
              Vista previa {proposal.source === "ai" ? "de la propuesta de la IA" : "de la plantilla"}:
            </span>{" "}
            {proposal.summary} ({proposal.diagram.states.length} estados, {proposal.diagram.transitions.length}{" "}
            transiciones). Reemplazará el flujo actual.
          </span>
          <Button size="sm" onClick={() => setProposal(undefined)}>
            Descartar propuesta
          </Button>
          <Button size="sm" variant="primary" onClick={applyProposal}>
            Usar este flujo
          </Button>
        </section>
      )}

      <div className="workflow-flow-grid grid min-h-0 flex-1 grid-cols-1 desktop:grid-cols-[1fr_300px]">
        <div className="overflow-auto border-r border-line bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px]">
          {proposal ? (
            <WorkflowCanvas diagram={proposal.diagram} zoom={zoom} onZoomChange={setZoom} />
          ) : (
            <>
              <AssistantBanner inconsistencies={current.length} onReview={() => setInspectorView("assistant")} />
              <WorkflowCanvas
                diagram={shown}
                selection={selection}
                onSelect={(next) => {
                  setSelection(next);
                  if (next) setInspectorView("settings");
                }}
                onMoveState={moveState}
                editable={canEdit}
                zoom={zoom}
                onZoomChange={setZoom}
              />
            </>
          )}
        </div>
        <WorkflowInspector
          view={inspectorView}
          onViewChange={setInspectorView}
          editor={{
            diagram,
            selection,
            onSelect: setSelection,
            onEdit: (change) => {
              edit(change);
              setStale(true);
            },
            readOnly: !canEdit,
          }}
          assistant={{
            diagram,
            suggestions: [...suggestions, ...aiSuggestions],
            decisions,
            onDecide: decide,
            onReanalyze: reanalyze,
            readOnly: !canEdit,
            stale,
            ai: { analyzing: aiAnalyzing, analysis: aiAnalysis, error: aiError, onAsk: askAi },
            header: canEdit ? <GenerateFlowSection onPropose={setProposal} /> : undefined,
            footer: (
              <>
                {recordNote && (
                  <p role="status" className="mt-3 text-label text-muted">
                    {recordNote}
                  </p>
                )}
                <AssistantMetrics appId={layout.id} refreshKey={metricsKey} load={workflowAiService.metrics} />
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
