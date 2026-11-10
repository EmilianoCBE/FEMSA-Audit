import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@/shared/hooks/useQuery";
import { Badge, type BadgeTone, Button, QueryState, SegmentedControl, type SegmentedOption } from "@/shared/ui";
import { designerService } from "../../designer/services/designerService";
import { formatDateTime } from "../../version-history/lib/formatPublishedAt";
import { WorkflowCanvas } from "../components/canvas/WorkflowCanvas";
import { fromStoredWorkflow } from "../lib/workflowStorage";
import { type ActionInput, missingForAction, timingLabel } from "../processes/processes";
import { processService } from "../processes/processService";
import type { ProcessAction, ProcessDetail, ProcessStatus, ProcessSummary } from "../processes/types";

// Fase 4 del workflow - Emiliano Carrizales: los procesos (hallazgos) recorren el flujo de su formulario. Cada uno
// queda anclado a la versión publicada con la que empezó y termina con ese flujo aunque se publique otra.

type Filter = ProcessStatus | "all";

const FILTERS: readonly SegmentedOption<Filter>[] = [
  { value: "active", label: "En curso" },
  { value: "completed", label: "Terminados" },
  { value: "all", label: "Todos" },
];

const KIND_TONE: Record<string, BadgeTone> = {
  Inicial: "gray",
  "En proceso": "amber",
  Aprobación: "blue",
  Retorno: "red",
  Final: "green",
};

export function ProcessesPanel() {
  const layouts = useQuery(useCallback((signal: AbortSignal) => designerService.listPlantillasDesigner(signal), []));
  const [params, setParams] = useSearchParams();

  return (
    <QueryState query={layouts}>
      {(plantillas) => {
        const layout = plantillas.find((item) => item.id === params.get("layout")) ?? plantillas[0];
        if (!layout) {
          return (
            <p className="p-4 text-body-sm text-muted">Crea un formulario en el Designer para iniciar procesos.</p>
          );
        }
        return (
          <ProcessBoard
            key={layout.id}
            appId={layout.id}
            plantillas={plantillas}
            selectedId={params.get("process") ?? undefined}
            onSelectApp={(id) => setParams({ layout: id }, { replace: true })}
            onSelectProcess={(id) =>
              setParams(id ? { layout: layout.id, process: id } : { layout: layout.id }, { replace: true })
            }
          />
        );
      }}
    </QueryState>
  );
}

type ProcessBoardProps = {
  appId: string;
  plantillas: readonly { id: string; name: string }[];
  selectedId?: string;
  onSelectApp: (id: string) => void;
  onSelectProcess: (id: string | undefined) => void;
};

function ProcessBoard({ appId, plantillas, selectedId, onSelectApp, onSelectProcess }: ProcessBoardProps) {
  const [filter, setFilter] = useState<Filter>("active");
  const [refresh, setRefresh] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh solo sirve para volver a pedir la lista.
  const fetcher = useCallback(
    (signal: AbortSignal) => processService.list(appId, filter === "all" ? undefined : filter, signal),
    [appId, filter, refresh],
  );
  const list = useQuery(fetcher);
  const reload = () => setRefresh((value) => value + 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        aria-label="Procesos del formulario"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-4 py-2.5"
      >
        <label className="flex items-center gap-2 text-body-sm text-ink-2">
          Formulario
          <select
            className="rounded border border-line-2 bg-surface px-2 py-1 text-body-sm"
            value={appId}
            onChange={(event) => onSelectApp(event.target.value)}
          >
            {plantillas.map((plantilla) => (
              <option key={plantilla.id} value={plantilla.id}>
                {plantilla.name}
              </option>
            ))}
          </select>
        </label>
        <SegmentedControl options={FILTERS} value={filter} onValueChange={setFilter} />
        <StartProcessForm
          appId={appId}
          onStarted={(process) => {
            setFilter("active");
            reload();
            onSelectProcess(process.id);
          }}
        />
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 desktop:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="overflow-y-auto border-r border-line p-3">
          <QueryState query={list}>
            {(processes) =>
              processes.length === 0 ? (
                <p className="p-3 text-body-sm text-muted">
                  {filter === "completed" ? "Todavía no hay procesos terminados." : "No hay procesos en curso."}
                </p>
              ) : (
                <ul aria-label="Procesos" className="space-y-1.5">
                  {processes.map((process) => (
                    <li key={process.id}>
                      <ProcessCard
                        process={process}
                        selected={process.id === selectedId}
                        onSelect={() => onSelectProcess(process.id)}
                      />
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryState>
        </div>
        <div className="min-w-0 overflow-y-auto">
          {selectedId ? (
            <ProcessDetailView key={selectedId} id={selectedId} onChanged={reload} />
          ) : (
            <p className="p-6 text-body-sm text-muted">
              Elige un proceso para ver su flujo, sus acciones y su historial.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StartProcessForm({ appId, onStarted }: { appId: string; onStarted: (process: ProcessSummary) => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    setBusy(true);
    setError(undefined);
    try {
      const process = await processService.start(appId, title.trim());
      setTitle("");
      onStarted(process);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar el proceso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      aria-label="Iniciar proceso"
      className="ml-auto flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
    >
      <input
        aria-label="Título del hallazgo"
        className="w-64 rounded border border-line-2 bg-surface px-2 py-1 text-body-sm"
        placeholder="Título del hallazgo (p. ej. Pagos sin firma)"
        maxLength={200}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Button type="submit" size="sm" variant="primary" disabled={busy || title.trim().length < 3}>
        {busy ? "Iniciando…" : "Iniciar proceso"}
      </Button>
      {error && (
        <p role="alert" className="basis-full text-right text-label text-red">
          {error}
        </p>
      )}
    </form>
  );
}

function VersionBadge({ version }: { version: ProcessSummary["version"] }) {
  return version.isCurrent ? (
    <Badge size="sm">v{version.number}</Badge>
  ) : (
    <Badge size="sm" tone="amber">
      v{version.number} · versión anterior
    </Badge>
  );
}

function ProcessCard({
  process,
  selected,
  onSelect,
}: {
  process: ProcessSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const timing = timingLabel(process);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`w-full rounded-md border px-3 py-2 text-left ${selected ? "border-accent bg-accent-bg/40" : "border-line bg-surface hover:border-accent-line"}`}
    >
      <span className="block truncate text-body-sm font-medium text-ink">{process.title}</span>
      <span className="mt-1 flex flex-wrap items-center gap-1">
        <Badge size="sm" tone={KIND_TONE[process.currentState.kind ?? ""] ?? "gray"}>
          {process.currentState.name}
        </Badge>
        <VersionBadge version={process.version} />
        {timing && (
          <Badge size="sm" tone={process.overdue ? "red" : "gray"}>
            {timing}
          </Badge>
        )}
      </span>
      <span className="mt-1 block text-label text-muted">
        {process.startedBy} · {formatDateTime(process.startedAt)}
      </span>
    </button>
  );
}

function ProcessDetailView({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [version, setVersion] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: version solo sirve para volver a pedir el detalle.
  const fetcher = useCallback((signal: AbortSignal) => processService.get(id, signal), [id, version]);
  const query = useQuery(fetcher);

  return (
    <QueryState query={query}>
      {(process) => (
        <ProcessDetailContent
          process={process}
          onMoved={() => {
            setVersion((value) => value + 1);
            onChanged();
          }}
        />
      )}
    </QueryState>
  );
}

function ProcessDetailContent({ process, onMoved }: { process: ProcessDetail; onMoved: () => void }) {
  const diagram = useMemo(() => (process.workflow ? fromStoredWorkflow(process.workflow) : null), [process.workflow]);
  const timing = timingLabel(process);

  return (
    <section aria-label={`Proceso ${process.title}`} className="space-y-4 p-4">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-heading-sm font-semibold text-ink">{process.title}</h3>
          <Badge tone={process.status === "completed" ? "green" : "blue"} size="sm">
            {process.status === "completed" ? "Terminado" : "En curso"}
          </Badge>
          <VersionBadge version={process.version} />
          {timing && (
            <Badge size="sm" tone={process.overdue ? "red" : "gray"}>
              {timing}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-label text-muted">
          Iniciado por {process.startedBy} el {formatDateTime(process.startedAt)}
          {process.completedAt && ` · terminado el ${formatDateTime(process.completedAt)}`}
        </p>
        {!process.version.isCurrent && (
          <p
            role="note"
            className="mt-2 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-label text-amber"
          >
            Este proceso empezó con v{process.version.number} y {process.status === "active" ? "termina" : "terminó"}{" "}
            con ese flujo, aunque ya se publicó una versión más nueva. Los procesos nuevos usan la vigente.
          </p>
        )}
      </header>

      {diagram && (
        <div className="overflow-auto rounded-md border border-line bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px]">
          <WorkflowCanvas diagram={diagram} selection={{ type: "state", id: process.currentState.id }} zoom={0.75} />
        </div>
      )}

      {process.status === "active" && (
        <section aria-label="Acciones disponibles" className="rounded-md border border-line bg-surface p-3">
          <h4 className="text-label font-semibold uppercase text-muted">
            Estado actual: <span className="normal-case text-ink">{process.currentState.name}</span>
          </h4>
          {process.actions.length === 0 ? (
            <p className="mt-2 text-label text-muted">Ninguna transición sale de este estado.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {process.actions.map((action) => (
                <li key={action.transitionId}>
                  <ActionRow processId={process.id} action={action} onMoved={onMoved} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-label text-muted">
            Tus roles en el flujo: {process.myRoles.length ? process.myRoles.join(", ") : "ninguno (solo consulta)"}.
          </p>
        </section>
      )}

      <section aria-label="Historial del proceso">
        <h4 className="mb-2 text-label font-semibold uppercase text-muted">Historial</h4>
        <ol className="space-y-2 border-l border-line pl-4">
          {process.history.map((entry) => (
            <li key={entry.id} className="text-body-sm text-ink-2">
              <span className="font-medium text-ink">{entry.actorName}</span>
              {entry.actorRole && <span className="text-muted"> ({entry.actorRole})</span>}{" "}
              {entry.fromStateName ? (
                <>
                  ejecutó «{entry.action}»: {entry.fromStateName} →{" "}
                  <span className="font-medium">{entry.toStateName}</span>
                </>
              ) : (
                <>
                  inició el proceso en <span className="font-medium">{entry.toStateName}</span>
                </>
              )}
              <span className="block text-label text-muted">{formatDateTime(entry.at)}</span>
              {entry.comment && <span className="block text-label">Comentario: {entry.comment}</span>}
              {entry.evidence && <span className="block text-label">Evidencia: {entry.evidence}</span>}
              {entry.actionPlan && (
                <span className="block text-label">
                  Plan de acción: {entry.actionPlan.description} · responsable {entry.actionPlan.owner} · compromiso{" "}
                  {entry.actionPlan.dueDate}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}

const inputClass = "mt-1 w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm text-ink";

function ActionRow({ processId, action, onMoved }: { processId: string; action: ProcessAction; onMoved: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<ActionInput>({
    comment: "",
    evidence: "",
    plan: { description: "", owner: "", dueDate: "" },
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const needs = action.requires;

  async function execute() {
    const missing = missingForAction(action, input);
    if (missing) {
      setError(missing);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await processService.transition(processId, {
        transitionId: action.transitionId,
        ...(input.comment.trim() && { comment: input.comment.trim() }),
        ...(input.evidence.trim() && { evidence: input.evidence.trim() }),
        ...(needs.actionPlan && { actionPlan: input.plan }),
      });
      onMoved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo ejecutar la acción.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-line px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={action.allowed ? "primary" : "secondary"}
          disabled={!action.allowed || busy}
          onClick={() => setOpen(!open)}
        >
          {action.label}
        </Button>
        <span className="text-label text-muted">
          → {action.toStateName} · {action.role ?? "sin rol"}
        </span>
      </div>
      {!action.allowed && action.reason && <p className="mt-1 text-label text-muted">{action.reason}</p>}
      {open && action.allowed && (
        <form
          aria-label={`Ejecutar ${action.label}`}
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            execute();
          }}
        >
          <label className="block text-label text-ink-2">
            Comentario{needs.comment ? " (obligatorio)" : " (opcional)"}
            <textarea
              className={`${inputClass} h-16`}
              maxLength={1000}
              value={input.comment}
              onChange={(event) => setInput({ ...input, comment: event.target.value })}
            />
          </label>
          {needs.evidence && (
            <label className="block text-label text-ink-2">
              Evidencia (enlace o nombre del documento)
              <input
                className={inputClass}
                maxLength={500}
                value={input.evidence}
                onChange={(event) => setInput({ ...input, evidence: event.target.value })}
              />
            </label>
          )}
          {needs.actionPlan && (
            <fieldset className="space-y-2 rounded border border-line p-2">
              <legend className="px-1 text-label font-medium text-ink-2">Plan de acción</legend>
              <label className="block text-label text-ink-2">
                Qué se hará
                <input
                  className={inputClass}
                  maxLength={500}
                  value={input.plan.description}
                  onChange={(event) => setInput({ ...input, plan: { ...input.plan, description: event.target.value } })}
                />
              </label>
              <label className="block text-label text-ink-2">
                Responsable
                <input
                  className={inputClass}
                  maxLength={150}
                  value={input.plan.owner}
                  onChange={(event) => setInput({ ...input, plan: { ...input.plan, owner: event.target.value } })}
                />
              </label>
              <label className="block text-label text-ink-2">
                Fecha compromiso
                <input
                  type="date"
                  className={inputClass}
                  value={input.plan.dueDate}
                  onChange={(event) => setInput({ ...input, plan: { ...input.plan, dueDate: event.target.value } })}
                />
              </label>
            </fieldset>
          )}
          {error && (
            <p role="alert" className="text-label text-red">
              {error}
            </p>
          )}
          <div className="flex gap-1.5">
            <Button type="submit" size="sm" variant="primary" disabled={busy}>
              {busy ? "Guardando…" : `Confirmar «${action.label}»`}
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
