import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Maximize2, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Eyebrow } from "@/shared/ui";
import { VersionStatusBadge } from "../../version-history/components/VersionStatusBadge";
import { versionsMock } from "../../version-history/data/versions.mock";
import { useQuery } from "@/shared/hooks/useQuery";
import { useCurrentDesignerLayout } from "../../designer/lib/currentLayout";
import { designerService } from "../../designer/services/designerService";
import { workflowRulesMock } from "../data/workflow.mock";
import { fromStoredWorkflow } from "../lib/workflowStorage";
import type { WorkflowDiagram } from "../types";
import {
  getActiveRules,
  getBranches,
  getReferenceDiagram,
  getSequenceSummary,
  hasFlow,
  lowerFirst,
} from "../lib/processSummary";
import { WorkflowStateNode } from "./canvas/WorkflowStateNode";
import { WorkflowTransitions } from "./canvas/WorkflowTransitions";

/** Estado guardado del panel */
const STORAGE_KEY = "femsa-audit:embedded-workflow-expanded";

/** Escala de la miniatura de la esquina */
const MINI_SCALE = 0.35;

/** Lo que muestra el panel, calculado a partir del flujo del formulario. */
function buildProcessModel(diagram: WorkflowDiagram) {
  return {
    flowConfigured: hasFlow(diagram),
    referenceDiagram: getReferenceDiagram(diagram),
    branches: getBranches(diagram),
    sequenceSummary: getSequenceSummary(diagram),
    // Las reglas siguen siendo de ejemplo hasta que la pestaña Reglas se guarde.
    activeRules: getActiveRules(diagram, workflowRulesMock),
  };
}

type ProcessModel = ReturnType<typeof buildProcessModel>;
const ProcessModelContext = createContext<ProcessModel>(buildProcessModel(fromStoredWorkflow(null)));
const useProcessModel = () => useContext(ProcessModelContext);

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

/** Diagrama de solo lectura */
function ReferenceDiagram() {
  const { referenceDiagram, sequenceSummary } = useProcessModel();
  return (
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
  );
}

/** Versión del flujo */
function VersionLabel() {
  return (
    <span className="ml-auto flex flex-none items-center gap-1.5 text-label text-muted">
      {sampleVersion.version}
      <VersionStatusBadge status={sampleVersion.status} />
    </span>
  );
}

/** Diagrama (o aviso si no hay flujo), desvíos y reglas */
function ProcessContent({ layoutId }: { layoutId?: string }) {
  const { flowConfigured, branches, activeRules } = useProcessModel();
  return (
    <>
      {flowConfigured ? (
        <div tabIndex={0} className="overflow-x-auto">
          <ReferenceDiagram />
        </div>
      ) : (
        <p className="px-3.5 py-6 text-center text-body-sm text-muted">
          Este formulario aún no tiene un flujo configurado.
        </p>
      )}
      {layoutId && (
        <div className="border-t border-line-soft px-3.5 py-2 text-right">
          <Link
            to={`/app-builder/workflow/flow?layout=${encodeURIComponent(layoutId)}`}
            className="text-label font-medium text-accent hover:underline"
          >
            Editar el flujo de este formulario
          </Link>
        </div>
      )}
      {/* Desvíos y reglas lado a lado (apilados en pantallas chicas) */}
      {(branches.length > 0 || activeRules.length > 0) && (
        <div className="grid divide-y divide-line-soft border-t border-line-soft desktop:auto-cols-fr desktop:grid-flow-col desktop:divide-x desktop:divide-y-0">
          {/* Desvíos */}
          {branches.length > 0 && (
            <div className="px-3.5 py-2.5">
              <Eyebrow className="mb-1">Desvíos ({branches.length})</Eyebrow>
              <ul className="flex max-h-28 flex-col gap-0.5 overflow-y-auto text-meta text-muted">
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
          {/* Reglas */}
          {activeRules.length > 0 && (
            <div className="px-3.5 py-2.5">
              <Eyebrow className="mb-1">Reglas ({activeRules.length})</Eyebrow>
              <ul className="flex max-h-28 flex-col gap-0.5 overflow-y-auto text-meta text-muted">
                {activeRules.map((rule) => (
                  <li key={rule.id}>
                    <span className="font-medium text-ink-2">{rule.name}</span>: {lowerFirst(rule.condition)} →{" "}
                    <span className="font-medium text-ink-2">{lowerFirst(rule.action)}</span>.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Miniatura en la esquina inferior derecha (arriba tapaba el panel derecho del Designer); al picarle abre el flujo en grande */
function WorkflowMiniature({ onOpen }: { onOpen: () => void }) {
  const { flowConfigured, referenceDiagram } = useProcessModel();
  return (
    // Entra con fade y un deslizamiento corto (sin animación si el sistema pide movimiento reducido)
    <div className="fixed right-4 bottom-4 z-20 rounded-md border border-accent-line bg-surface p-2.5 shadow-lg transition duration-200 ease-out hover:border-accent starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none">
      <div className="flex items-center gap-2">
        <Eyebrow size="sm">Flujo del proceso</Eyebrow>
        <Maximize2 aria-hidden className="ml-auto size-3 text-muted" />
      </div>
      {/* Solo el diagrama, en escritorio */}
      <div aria-hidden className="mt-1.5 hidden desktop:block">
        {flowConfigured ? (
          <div
            className="overflow-hidden"
            style={{
              width: referenceDiagram.size.width * MINI_SCALE,
              height: referenceDiagram.size.height * MINI_SCALE,
            }}
          >
            <div className="origin-top-left" style={{ transform: `scale(${MINI_SCALE})` }}>
              <ReferenceDiagram />
            </div>
          </div>
        ) : (
          <p className="text-meta text-muted">Sin flujo configurado</p>
        )}
      </div>
      {/* Toda la tarjeta abre el flujo */}
      <button
        type="button"
        aria-label="Ver flujo del proceso en grande"
        onClick={onOpen}
        className="absolute inset-0 rounded-md"
      />
    </div>
  );
}

/** Panel del flujo del proceso (US05) */
export function EmbeddedWorkflowPanel() {
  // Fase 2: el flujo guardado del formulario abierto en el Designer (o el primero); sin flujo, la plantilla base.
  const selectedId = useCurrentDesignerLayout();
  const { data: layouts } = useQuery(
    useCallback((signal: AbortSignal) => designerService.listPlantillasDesigner(signal), []),
  );
  const layout = layouts?.find((item) => item.id === selectedId) ?? layouts?.[0];
  const workflow = layout?.workflow;
  const model = useMemo(() => buildProcessModel(fromStoredWorkflow(workflow)), [workflow]);
  const { flowConfigured, branches, activeRules, sequenceSummary } = model;
  const [expanded, setExpanded] = useState(readExpanded);
  const [scrolledPast, setScrolledPast] = useState(false);
  const contentId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Mostrar la miniatura solo cuando el panel quedó arriba, fuera de la pantalla
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    // En escritorio hace scroll el contenido (data-app-scroll), no la ventana: se mide contra ese contenedor.
    const container = panel.closest<HTMLElement>("[data-app-scroll]");
    const root = container && getComputedStyle(container).overflowY !== "visible" ? container : null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
      },
      { root },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    saveExpanded(next);
  }

  return (
    <ProcessModelContext.Provider value={model}>
      <div className="px-4 pt-5 desktop:px-6">
        <section ref={panelRef} className="rounded-md border border-line bg-surface">
          {/* Barra */}
          <div className="flex items-center gap-2 px-3.5 py-2">
            <Eyebrow size="sm" className="flex-none">
              Flujo del proceso
            </Eyebrow>
            {!expanded && (
              <p className="min-w-0 truncate text-meta text-muted">
                {flowConfigured ? sequenceSummary : "Sin flujo configurado"}
                {branches.length > 0 && ` · ${branches.length} ${branches.length === 1 ? "desvío" : "desvíos"}`}
                {activeRules.length > 0 && ` · ${activeRules.length} ${activeRules.length === 1 ? "regla" : "reglas"}`}
              </p>
            )}
            <VersionLabel />
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
            <ProcessContent layoutId={layout?.id} />
          </div>
        </section>

        {scrolledPast && <WorkflowMiniature onOpen={() => dialogRef.current?.showModal()} />}

        {/* Flujo en grande sin salir de donde va el usuario (Esc o clic fuera lo cierra) */}
        <dialog
          ref={dialogRef}
          aria-label="Flujo del proceso"
          onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
          className="m-auto w-[min(1080px,calc(100vw-32px))] rounded-md border border-line bg-surface p-0 backdrop:bg-ink/40"
        >
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
            <Eyebrow size="sm">Flujo del proceso</Eyebrow>
            <VersionLabel />
            <button
              type="button"
              aria-label="Cerrar flujo del proceso"
              title="Cerrar"
              onClick={() => dialogRef.current?.close()}
              className="flex-none rounded p-1 text-muted hover:bg-bg hover:text-ink-2"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <ProcessContent layoutId={layout?.id} />
        </dialog>
      </div>
    </ProcessModelContext.Provider>
  );
}
