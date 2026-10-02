import { useState } from "react";
import { AssistantBanner } from "../components/AssistantBanner";
import { WorkflowCanvas } from "../components/canvas/WorkflowCanvas";
import { WorkflowInspector, type InspectorView } from "../components/inspector/WorkflowInspector";
import {
  assistantSuggestionsMock,
  assistantSummaryMock,
  findingLifecycleMock,
  selectedTransitionMock,
} from "../data/workflow.mock";

// TODO(US05 - Juan Aguilar): permitir minimizar/expandir el workflow integrado sin salir del Designer.
export function FlowPanel() {
  const [inspectorView, setInspectorView] = useState<InspectorView>("settings");

  return (
    <div className="workflow-flow-grid grid min-h-0 flex-1 grid-cols-1 desktop:grid-cols-[1fr_300px]">
      <div className="overflow-auto border-r border-line bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px]">
        <AssistantBanner summary={assistantSummaryMock} onReview={() => setInspectorView("assistant")} />
        <WorkflowCanvas diagram={findingLifecycleMock} />
      </div>
      <WorkflowInspector
        view={inspectorView}
        onViewChange={setInspectorView}
        settings={selectedTransitionMock}
        suggestions={assistantSuggestionsMock}
      />
    </div>
  );
}
