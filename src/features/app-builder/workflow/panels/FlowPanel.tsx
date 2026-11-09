import { useMemo, useState } from "react";
import { ANALYZE_TIMEOUT_MS, assistantErrorMessage } from "@/features/app-builder/assistant/lib/aiAvailability";
import { AssistantBanner } from "../components/AssistantBanner";
import { WorkflowCanvas } from "../components/canvas/WorkflowCanvas";
import type { WorkflowDecision } from "../components/inspector/DesignAssistantPanel";
import { WorkflowInspector, type InspectorView } from "../components/inspector/WorkflowInspector";
import { findingLifecycleMock, selectedTransitionMock } from "../data/workflow.mock";
import {
  analyzeWorkflow,
  applyWorkflowChange,
  suggestionWarnings,
  type WorkflowChange,
  type WorkflowSuggestion,
} from "../lib/workflowAssistant";
import { buildWorkflowAiRequest, toWorkflowSuggestions, type WorkflowAiAnalysis } from "../lib/workflowAi";
import { workflowAiService } from "../services/workflowAiService";

// El flujo aún es de ejemplo (sin tabla en la BD): los cambios aceptados viven en pantalla.
export function FlowPanel() {
  const [inspectorView, setInspectorView] = useState<InspectorView>("settings");
  const [diagram, setDiagram] = useState(findingLifecycleMock);
  // Lista que ve el usuario: se calcula al abrir y al pedir "Volver a analizar", para que las decididas no desaparezcan.
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>(() => analyzeWorkflow(findingLifecycleMock));
  const [decisions, setDecisions] = useState<Record<string, WorkflowDecision>>({});
  // US15: lo que propuso la IA en la última consulta (se pide con un botón, no en cada cambio).
  const [aiAnalysis, setAiAnalysis] = useState<WorkflowAiAnalysis>();
  const [aiSuggestions, setAiSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string>();

  // Las marcas del diagrama y el aviso sí reflejan el flujo actual.
  const current = useMemo(() => analyzeWorkflow(diagram), [diagram]);
  const shown = useMemo(() => ({ ...diagram, warnings: suggestionWarnings(diagram, current) }), [diagram, current]);

  function decide(suggestion: WorkflowSuggestion, decision: WorkflowDecision, change?: WorkflowChange) {
    if (change) setDiagram((previous) => applyWorkflowChange(previous, change));
    setDecisions((previous) => ({ ...previous, [suggestion.id]: decision }));
  }

  function reanalyze() {
    setSuggestions(analyzeWorkflow(diagram));
    setDecisions({});
    setAiAnalysis(undefined);
    setAiSuggestions([]);
    setAiError(undefined);
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

  return (
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
  );
}
