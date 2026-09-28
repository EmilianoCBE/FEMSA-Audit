import type { WorkflowDiagram } from "../../types";
import { CanvasAnnotationTag, CanvasWarningDot } from "./CanvasMarkers";
import { CanvasToolbar } from "./CanvasToolbar";
import { SuggestedStateNode } from "./SuggestedStateNode";
import { WorkflowStateNode } from "./WorkflowStateNode";
import { WorkflowTransitions } from "./WorkflowTransitions";

/** Dibuja el diagrama completo a partir de datos; no conoce el origen del flujo. */
export function WorkflowCanvas({ diagram }: { diagram: WorkflowDiagram }) {
  return (
    <div className="workflow-canvas relative mx-6 my-7" style={{ width: diagram.size.width, height: diagram.size.height }}>
      <CanvasToolbar />
      <WorkflowTransitions size={diagram.size} transitions={diagram.transitions} />
      {diagram.states.map((state) => (
        <WorkflowStateNode key={state.id} state={state} selected={state.id === diagram.selectedStateId} />
      ))}
      {diagram.annotations.map((annotation) => (
        <CanvasAnnotationTag key={annotation.id} annotation={annotation} />
      ))}
      {diagram.warnings.map((warning) => (
        <CanvasWarningDot key={warning.id} warning={warning} />
      ))}
      {diagram.suggestedStates.map((state) => (
        <SuggestedStateNode key={state.id} state={state} />
      ))}
    </div>
  );
}
