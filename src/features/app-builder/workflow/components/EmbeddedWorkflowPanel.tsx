import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Eyebrow } from "@/shared/ui";
import { VersionStatusBadge } from "../../version-history/components/VersionStatusBadge";
import { versionsMock } from "../../version-history/data/versions.mock";
import { findingLifecycleMock } from "../data/workflow.mock";
import type { Point, WorkflowDiagram, WorkflowState } from "../types";
import { WorkflowStateNode } from "./canvas/WorkflowStateNode";
import { WorkflowTransitions } from "./canvas/WorkflowTransitions";

/** Estado guardado del panel */
const STORAGE_KEY = "femsa-audit:embedded-workflow-expanded";

/** Medidas del diagrama */
const NODE_SIZE = { width: 152, height: 60 };
const NODE_SNAP = 10;
const DIAGRAM_PADDING = 20;

/** Diagrama de solo lectura */
function getReferenceDiagram(diagram: WorkflowDiagram) {
  const bottom = Math.max(...diagram.states.map((state) => state.position.y + NODE_SIZE.height));
  return {
    size: { width: diagram.size.width, height: bottom + DIAGRAM_PADDING },
    states: diagram.states,
    transitions: diagram.transitions
      .filter((transition) => transition.variant !== "suggested")
      .map((transition) =>
        transition.variant === "active" ? { ...transition, variant: "default" as const } : transition,
      ),
  };
}

/** Secuencia principal */
function getMainSequence({ states }: WorkflowDiagram) {
  const mainRow = Math.min(...states.map((state) => state.position.y));
  return states.filter((state) => state.position.y === mainRow).sort((a, b) => a.position.x - b.position.x);
}

/** Inicio y fin de una flecha */
function getPathEnds(path: string): [Point, Point] | null {
  const numbers = path.match(/-?\d+(\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length < 4) return null;
  return [
    { x: numbers[0], y: numbers[1] },
    { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] },
  ];
}

/** Estado en un punto */
function findStateAt(states: readonly WorkflowState[], point: Point) {
  return states.find(
    ({ position }) =>
      point.x >= position.x - NODE_SNAP &&
      point.x <= position.x + NODE_SIZE.width + NODE_SNAP &&
      point.y >= position.y - NODE_SNAP &&
      point.y <= position.y + NODE_SIZE.height + NODE_SNAP,
  );
}

/** Desvíos del flujo */
function getBranches(diagram: WorkflowDiagram) {
  const sequence = getMainSequence(diagram);
  return diagram.transitions.flatMap((transition) => {
    const ends = getPathEnds(transition.path);
    if (!ends) return [];
    const from = findStateAt(diagram.states, ends[0]);
    const to = findStateAt(diagram.states, ends[1]);
    if (!from || !to) return [];
    if (sequence.includes(from) && sequence.indexOf(to) === sequence.indexOf(from) + 1) return [];
    return [{ id: transition.id, label: transition.label, from, to, returns: sequence.includes(to) }];
  });
}

/** Datos del mock */
const referenceDiagram = getReferenceDiagram(findingLifecycleMock);
const branches = getBranches(findingLifecycleMock);
const sequenceSummary = getMainSequence(findingLifecycleMock)
  .map((state) => state.name)
  .join(" → ");
const sampleVersion = versionsMock.find((version) => version.status === "draft") ?? versionsMock[0];

/** Leer y guardar estado del panel */
function readExpanded() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveExpanded(expanded: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(expanded));
  } catch {
    return;
  }
}

/** Panel del flujo del proceso (US05) */
export function EmbeddedWorkflowPanel() {
  const [expanded, setExpanded] = useState(readExpanded);
  const contentId = useId();

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    saveExpanded(next);
  }

  return (
    <div className="px-4 pt-5 desktop:px-6">
      <section className="rounded-md border border-line bg-surface">
        {/* Barra */}
        <div className="flex items-center gap-2 px-3.5 py-2">
          <Eyebrow size="sm" className="flex-none">
            Flujo del proceso
          </Eyebrow>
          {!expanded && (
            <p className="min-w-0 truncate text-meta text-muted">
              {sequenceSummary}
              {branches.length > 0 && ` · ${branches.length} ${branches.length === 1 ? "desvío" : "desvíos"}`}
            </p>
          )}
          {/* Versión */}
          <span className="ml-auto flex flex-none items-center gap-1.5 text-label text-muted">
            {sampleVersion.version}
            <VersionStatusBadge status={sampleVersion.status} />
          </span>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={expanded ? "Minimizar flujo del proceso" : "Expandir flujo del proceso"}
            title={expanded ? "Minimizar" : "Expandir"}
            onClick={toggle}
            className="flex-none rounded p-1 text-muted hover:bg-bg hover:text-ink-2"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", !expanded && "-rotate-90")} />
          </button>
        </div>
        <div id={contentId} hidden={!expanded} className="border-t border-line">
          {/* Diagrama */}
          <div tabIndex={0} className="overflow-x-auto">
            <div
              role="img"
              aria-label={`Diagrama del flujo: ${sequenceSummary}`}
              className="relative"
              style={{ width: referenceDiagram.size.width, height: referenceDiagram.size.height }}
            >
              <WorkflowTransitions size={referenceDiagram.size} transitions={referenceDiagram.transitions} />
              {referenceDiagram.states.map((state) => (
                <WorkflowStateNode key={state.id} state={state} />
              ))}
            </div>
          </div>
          {/* Desvíos */}
          {branches.length > 0 && (
            <div className="border-t border-line-soft px-3.5 py-2.5">
              <Eyebrow className="mb-1">Desvíos</Eyebrow>
              <ul className="flex flex-col gap-0.5 text-meta text-muted">
                {branches.map((branch) => (
                  <li key={branch.id}>
                    Desde <span className="font-medium text-ink-2">{branch.from.name}</span> se puede{" "}
                    <span className="font-medium text-ink-2">{branch.label}</span> y{" "}
                    {branch.returns ? "regresa" : "pasa"} a{" "}
                    <span className="font-medium text-ink-2">{branch.to.name}</span>.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
