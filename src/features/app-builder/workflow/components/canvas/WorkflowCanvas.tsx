import { type KeyboardEvent, type PointerEvent, useRef } from "react";
import type { Point, WorkflowDiagram } from "../../types";
import type { FlowSelection } from "../inspector/FlowEditorPanel";
import { CanvasAnnotationTag, CanvasWarningDot } from "./CanvasMarkers";
import { CanvasToolbar } from "./CanvasToolbar";
import { SuggestedStateNode } from "./SuggestedStateNode";
import { WorkflowStateNode } from "./WorkflowStateNode";
import { WorkflowTransitions } from "./WorkflowTransitions";

/** Cómo se mueve un estado: arrastrando (move / end) o con el teclado (key). */
export type MovePhase = "move" | "end" | "key";

type WorkflowCanvasProps = {
  diagram: WorkflowDiagram;
  /** Fase 2: con estas funciones el diagrama se puede seleccionar y, si `editable`, reacomodar. */
  selection?: FlowSelection;
  onSelect?: (selection: FlowSelection) => void;
  onMoveState?: (stateId: string, position: Point, phase: MovePhase) => void;
  editable?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
};

/** Distancia mínima para que un clic cuente como arrastre. */
const DRAG_THRESHOLD = 4;

/** Dibuja el diagrama completo a partir de datos; no conoce el origen del flujo. */
export function WorkflowCanvas({
  diagram,
  selection = null,
  onSelect,
  onMoveState,
  editable = false,
  zoom = 1,
  onZoomChange,
}: WorkflowCanvasProps) {
  const drag = useRef<{ id: string; start: Point; origin: Point; moved: boolean } | null>(null);
  const interactive = Boolean(onSelect);

  const positionFrom = (current: NonNullable<typeof drag.current>, event: PointerEvent) => ({
    x: current.origin.x + (event.clientX - current.start.x) / zoom,
    y: current.origin.y + (event.clientY - current.start.y) / zoom,
  });

  const stateHandlers = (id: string, origin: Point) =>
    interactive
      ? {
          onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            drag.current = { id, start: { x: event.clientX, y: event.clientY }, origin, moved: false };
          },
          onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
            const current = drag.current;
            if (!current || current.id !== id || !editable || !onMoveState) return;
            const distance = Math.hypot(event.clientX - current.start.x, event.clientY - current.start.y);
            if (!current.moved && distance < DRAG_THRESHOLD) return;
            current.moved = true;
            onMoveState(id, positionFrom(current, event), "move");
          },
          onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
            const current = drag.current;
            drag.current = null;
            if (!current || current.id !== id) return;
            if (current.moved && onMoveState) onMoveState(id, positionFrom(current, event), "end");
            else onSelect?.({ type: "state", id });
          },
          onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect?.({ type: "state", id });
              return;
            }
            const step = event.shiftKey ? 50 : 10;
            const delta: Record<string, Point> = {
              ArrowLeft: { x: -step, y: 0 },
              ArrowRight: { x: step, y: 0 },
              ArrowUp: { x: 0, y: -step },
              ArrowDown: { x: 0, y: step },
            };
            const move = delta[event.key];
            if (!move || !editable || !onMoveState) return;
            event.preventDefault();
            onMoveState(id, { x: origin.x + move.x, y: origin.y + move.y }, "key");
          },
        }
      : undefined;

  return (
    <div
      className="relative mx-6 my-7"
      style={{ width: diagram.size.width * zoom, height: diagram.size.height * zoom }}
    >
      <CanvasToolbar zoom={zoom} onZoomChange={onZoomChange} />
      <div
        className="workflow-canvas absolute top-0 left-0 origin-top-left"
        style={{ width: diagram.size.width, height: diagram.size.height, transform: `scale(${zoom})` }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onSelect?.(null);
        }}
      >
        <WorkflowTransitions
          size={diagram.size}
          transitions={diagram.transitions}
          selectedId={selection?.type === "transition" ? selection.id : undefined}
          onSelect={onSelect && ((id) => onSelect({ type: "transition", id }))}
        />
        {diagram.states.map((state) => (
          <WorkflowStateNode
            key={state.id}
            state={state}
            selected={
              selection ? selection.type === "state" && selection.id === state.id : state.id === diagram.selectedStateId
            }
            interactive={interactive}
            draggable={editable}
            {...stateHandlers(state.id, state.position)}
          />
        ))}
        {diagram.annotations.map((annotation) => (
          <CanvasAnnotationTag key={annotation.id} annotation={annotation} />
        ))}
        {diagram.warnings.map((warning) => (
          <CanvasWarningDot key={warning.id} warning={warning} />
        ))}
        {diagram.suggestedStates.map((state) => (
          <SuggestedStateNode
            key={state.id}
            state={state}
            selected={selection?.type === "suggested" && selection.id === state.id}
            onSelect={onSelect && (() => onSelect({ type: "suggested", id: state.id }))}
          />
        ))}
      </div>
    </div>
  );
}
