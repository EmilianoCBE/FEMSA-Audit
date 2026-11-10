import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Badge, Button, InspectorHeader, InspectorSection } from "@/shared/ui";
import {
  LIMITS,
  neighbors,
  newStateId,
  REQUIREMENTS,
  STATE_KIND_HELP,
  STATE_KINDS,
  type StateKind,
  stateNameError,
  transitionError,
  type WorkflowEdit,
} from "../../lib/workflowEditing";
import { proposeRole, WORKFLOW_ROLES } from "../../lib/workflowAssistant";
import type { WorkflowDiagram, WorkflowTransition } from "../../types";

// Fase 2 del workflow - Emiliano Carrizales: edición manual del flujo desde el inspector. Sin selección se ven todos
// los estados y transiciones; al elegir uno se edita (US04: también se navega a sus predecesores y sucesores).

export type FlowSelection = { type: "state" | "transition" | "suggested"; id: string } | null;

type FlowEditorPanelProps = {
  diagram: WorkflowDiagram;
  selection: FlowSelection;
  onSelect: (selection: FlowSelection) => void;
  onEdit: (edit: WorkflowEdit) => void;
  readOnly: boolean;
};

const inputClass =
  "mt-1 w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm text-ink disabled:bg-nav disabled:text-muted";
const labelClass = "block text-label text-ink-2";

export function FlowEditorPanel({ diagram, selection, onSelect, onEdit, readOnly }: FlowEditorPanelProps) {
  if (selection?.type === "state") {
    const state = diagram.states.find((item) => item.id === selection.id);
    if (state) {
      return (
        <StateEditor
          key={state.id}
          diagram={diagram}
          stateId={state.id}
          onSelect={onSelect}
          onEdit={onEdit}
          readOnly={readOnly}
        />
      );
    }
  }
  if (selection?.type === "transition") {
    const transition = diagram.transitions.find((item) => item.id === selection.id);
    if (transition) {
      return (
        <TransitionEditor
          key={transition.id}
          diagram={diagram}
          transition={transition}
          onSelect={onSelect}
          onEdit={onEdit}
          readOnly={readOnly}
        />
      );
    }
  }
  if (selection?.type === "suggested") {
    const suggested = diagram.suggestedStates.find((item) => item.id === selection.id);
    if (suggested) {
      return (
        <SuggestedEditor
          key={suggested.id}
          name={suggested.name}
          onBack={() => onSelect(null)}
          onAccept={(kind) => {
            onEdit({ op: "accept-suggested-state", stateId: suggested.id, kind });
            onSelect({ type: "state", id: suggested.id });
          }}
          onRemove={() => {
            onEdit({ op: "remove-suggested-state", stateId: suggested.id });
            onSelect(null);
          }}
          readOnly={readOnly}
        />
      );
    }
  }
  return <Overview diagram={diagram} onSelect={onSelect} onEdit={onEdit} readOnly={readOnly} />;
}

/* ---------- Vista general ---------- */

function Overview({ diagram, onSelect, onEdit, readOnly }: Omit<FlowEditorPanelProps, "selection">) {
  const stateName = (id: string) => diagram.states.find((state) => state.id === id)?.name ?? id;
  const real = diagram.transitions.filter((transition) => transition.variant !== "suggested");

  return (
    <section aria-label="Editor del flujo">
      <InspectorHeader eyebrow="Configuración" title="Estados y transiciones" />
      <InspectorSection>
        <p className="text-meta/[1.45] text-muted">
          Haz clic en un estado o transición del diagrama (o en la lista) para editarlo. Arrastra los estados para
          acomodarlos; con un estado seleccionado también se mueve con las flechas del teclado.
        </p>
        {!readOnly && (
          <Button className="mt-2.5 w-full" size="sm" onClick={() => onEdit({ op: "auto-layout" })}>
            Ordenar diagrama
          </Button>
        )}
      </InspectorSection>

      {!readOnly && (
        <InspectorSection title="Agregar">
          <AddStateForm diagram={diagram} onEdit={onEdit} onAdded={(id) => onSelect({ type: "state", id })} />
          <div className="my-3 border-t border-line" />
          <AddTransitionForm diagram={diagram} onEdit={onEdit} />
        </InspectorSection>
      )}

      <InspectorSection title={`Estados (${diagram.states.length})`}>
        <ul className="space-y-1">
          {diagram.states.map((state) => (
            <li key={state.id}>
              <ListButton onClick={() => onSelect({ type: "state", id: state.id })}>
                <span className="min-w-0 flex-1 truncate">{state.name}</span>
                <Badge size="sm">{state.kind}</Badge>
              </ListButton>
            </li>
          ))}
        </ul>
      </InspectorSection>

      <InspectorSection title={`Transiciones (${real.length})`}>
        {real.length === 0 ? (
          <p className="text-label text-muted">Todavía no hay transiciones.</p>
        ) : (
          <ul className="space-y-1">
            {real.map((transition) => (
              <li key={transition.id}>
                <ListButton onClick={() => onSelect({ type: "transition", id: transition.id })}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{transition.label}</span>
                    <span className="block truncate text-label text-muted">
                      {stateName(transition.from)} → {stateName(transition.to)} · {transition.role ?? "sin rol"}
                    </span>
                  </span>
                </ListButton>
              </li>
            ))}
          </ul>
        )}
      </InspectorSection>

      {diagram.suggestedStates.length > 0 && (
        <InspectorSection title="Propuestos por el diseño">
          <ul className="space-y-1">
            {diagram.suggestedStates.map((state) => (
              <li key={state.id}>
                <ListButton onClick={() => onSelect({ type: "suggested", id: state.id })}>
                  <span className="min-w-0 flex-1 truncate">{state.name}</span>
                  <Badge tone="blue" size="sm">
                    Sugerido
                  </Badge>
                </ListButton>
              </li>
            ))}
          </ul>
        </InspectorSection>
      )}
    </section>
  );
}

function ListButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded border border-line px-2 py-1.5 text-left text-body-sm text-ink hover:border-accent-line hover:bg-accent-bg/40"
    >
      {children}
    </button>
  );
}

function AddStateForm({
  diagram,
  onEdit,
  onAdded,
}: {
  diagram: WorkflowDiagram;
  onEdit: (edit: WorkflowEdit) => void;
  onAdded: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<StateKind>("En proceso");
  const [touched, setTouched] = useState(false);
  const error = stateNameError(diagram, name);
  const full = diagram.states.length >= LIMITS.states;

  function add() {
    setTouched(true);
    if (error || full) return;
    const id = newStateId(diagram, name);
    onEdit({ op: "add-state", name, kind });
    setName("");
    setTouched(false);
    onAdded(id);
  }

  return (
    <form
      aria-label="Agregar estado"
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        add();
      }}
    >
      <label className={labelClass}>
        Nombre del estado
        <input
          className={inputClass}
          value={name}
          maxLength={80}
          placeholder="Por ejemplo: Respuesta del área"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <KindSelect value={kind} onChange={setKind} />
      {touched && error && <FieldError>{error}</FieldError>}
      {full && <FieldError>El flujo ya tiene el máximo de {LIMITS.states} estados.</FieldError>}
      <Button type="submit" size="sm" variant="primary" className="w-full" disabled={full}>
        Agregar estado
      </Button>
    </form>
  );
}

function AddTransitionForm({
  diagram,
  onEdit,
  initialFrom,
}: {
  diagram: WorkflowDiagram;
  onEdit: (edit: WorkflowEdit) => void;
  initialFrom?: string;
}) {
  const first = diagram.states.find((state) => state.kind !== "Final")?.id ?? "";
  const [from, setFrom] = useState(initialFrom ?? first);
  const [to, setTo] = useState(diagram.states.find((state) => state.id !== (initialFrom ?? first))?.id ?? "");
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<string>(() => proposeRole(diagram, initialFrom ?? first, to));
  const [touched, setTouched] = useState(false);
  const error = transitionError(diagram, { from, to, label });
  const full = diagram.transitions.length >= LIMITS.transitions;

  function add() {
    setTouched(true);
    if (error || full) return;
    onEdit({ op: "add-transition", from, to, label: label.trim(), role });
    setLabel("");
    setTouched(false);
  }

  return (
    <form
      aria-label="Agregar transición"
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        add();
      }}
    >
      <StateSelect label="Desde" diagram={diagram} value={from} onChange={setFrom} />
      <StateSelect
        label="Hacia"
        diagram={diagram}
        value={to}
        onChange={(value) => {
          setTo(value);
          setRole(proposeRole(diagram, from, value));
        }}
      />
      <label className={labelClass}>
        Acción
        <input
          className={inputClass}
          value={label}
          maxLength={60}
          placeholder="Por ejemplo: aprobar, devolver"
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>
      <RoleSelect value={role} onChange={(value) => setRole(value ?? WORKFLOW_ROLES[0])} allowEmpty={false} />
      {touched && error && <FieldError>{error}</FieldError>}
      {full && <FieldError>El flujo ya tiene el máximo de {LIMITS.transitions} transiciones.</FieldError>}
      <Button type="submit" size="sm" variant="primary" className="w-full" disabled={full}>
        Agregar transición
      </Button>
    </form>
  );
}

/* ---------- Estado ---------- */

function StateEditor({
  diagram,
  stateId,
  onSelect,
  onEdit,
  readOnly,
}: {
  diagram: WorkflowDiagram;
  stateId: string;
  onSelect: (selection: FlowSelection) => void;
  onEdit: (edit: WorkflowEdit) => void;
  readOnly: boolean;
}) {
  const state = diagram.states.find((item) => item.id === stateId);
  const [name, setName] = useState(state?.name ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adding, setAdding] = useState(false);
  if (!state) return null;
  const nameError = stateNameError(diagram, name, state.id);
  const { incoming, outgoing } = neighbors(diagram, state.id);
  const connected = diagram.transitions.filter(
    (transition) => transition.from === state.id || transition.to === state.id,
  ).length;

  const commitName = () => {
    if (!nameError && name.trim() !== state.name) onEdit({ op: "update-state", stateId: state.id, name });
  };

  return (
    <section aria-label={`Estado ${state.name}`}>
      <BackButton onClick={() => onSelect(null)} />
      <InspectorHeader eyebrow="Estado seleccionado" title={state.name} />
      <InspectorSection title="Datos">
        <div className="space-y-2">
          <label className={labelClass}>
            Nombre
            <input
              className={inputClass}
              value={name}
              maxLength={80}
              disabled={readOnly}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => event.key === "Enter" && commitName()}
            />
          </label>
          {nameError && <FieldError>{nameError}</FieldError>}
          <KindSelect
            value={state.kind as StateKind}
            disabled={readOnly}
            onChange={(kind) => onEdit({ op: "update-state", stateId: state.id, kind })}
          />
          <label className={labelClass}>
            Plazo máximo en este estado (días)
            <input
              type="number"
              min={1}
              max={365}
              className={inputClass}
              value={state.slaDays ?? ""}
              placeholder="Sin plazo"
              disabled={readOnly}
              onChange={(event) => {
                const days = Number.parseInt(event.target.value, 10);
                onEdit({
                  op: "update-state",
                  stateId: state.id,
                  slaDays: Number.isFinite(days) && days >= 1 ? Math.min(days, 365) : null,
                });
              }}
            />
            <span className="mt-1 block text-label text-muted">
              Si un hallazgo pasa más días aquí, se considera vencido (por ejemplo, 30 días para la respuesta del área).
            </span>
          </label>
        </div>
      </InspectorSection>

      <InspectorSection title={`Llega desde (${incoming.length})`}>
        <NeighborList
          items={incoming}
          direction="in"
          empty={state.kind === "Inicial" ? "Es el estado inicial." : "Ninguna transición llega aquí."}
          onSelect={onSelect}
        />
      </InspectorSection>
      <InspectorSection title={`Sale hacia (${outgoing.length})`}>
        <NeighborList
          items={outgoing}
          direction="out"
          empty={state.kind === "Final" ? "Es un estado final." : "Ninguna transición sale de aquí."}
          onSelect={onSelect}
        />
        {!readOnly && state.kind !== "Final" && (
          <div className="mt-2.5">
            {adding ? (
              <div className="rounded border border-accent-line bg-accent-bg p-2">
                <AddTransitionForm
                  diagram={diagram}
                  initialFrom={state.id}
                  onEdit={(edit) => {
                    onEdit(edit);
                    setAdding(false);
                  }}
                />
                <Button size="sm" className="mt-2 w-full" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => setAdding(true)}>
                Agregar transición desde aquí
              </Button>
            )}
          </div>
        )}
      </InspectorSection>

      {!readOnly && (
        <InspectorSection>
          {confirmDelete ? (
            <div role="alert" className="rounded border border-red-line bg-red-bg p-2 text-label text-red">
              Se eliminará «{state.name}»
              {connected > 0 &&
                ` y ${connected} ${connected === 1 ? "transición conectada" : "transiciones conectadas"}`}
              .
              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onEdit({ op: "remove-state", stateId: state.id });
                    onSelect(null);
                  }}
                >
                  Sí, eliminar
                </Button>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
              Eliminar estado
            </Button>
          )}
        </InspectorSection>
      )}
    </section>
  );
}

function NeighborList({
  items,
  direction,
  empty,
  onSelect,
}: {
  items: ReturnType<typeof neighbors>["incoming"];
  direction: "in" | "out";
  empty: string;
  onSelect: (selection: FlowSelection) => void;
}) {
  if (items.length === 0) return <p className="text-label text-muted">{empty}</p>;
  const Icon = direction === "in" ? ArrowLeft : ArrowRight;
  return (
    <ul className="space-y-1">
      {items.map(({ transition, stateId, stateName }) => (
        <li key={transition.id} className="flex items-center gap-1.5 text-body-sm">
          <Icon aria-hidden size={14} className="flex-none text-muted" />
          <button
            type="button"
            className="min-w-0 truncate font-medium text-accent hover:underline"
            onClick={() => onSelect({ type: "state", id: stateId })}
          >
            {stateName}
          </button>
          <button
            type="button"
            className="ml-auto min-w-0 truncate text-label text-muted hover:text-ink hover:underline"
            title="Editar la transición"
            onClick={() => onSelect({ type: "transition", id: transition.id })}
          >
            «{transition.label}» · {transition.role ?? "sin rol"}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Transición ---------- */

function TransitionEditor({
  diagram,
  transition,
  onSelect,
  onEdit,
  readOnly,
}: {
  diagram: WorkflowDiagram;
  transition: WorkflowTransition;
  onSelect: (selection: FlowSelection) => void;
  onEdit: (edit: WorkflowEdit) => void;
  readOnly: boolean;
}) {
  const [label, setLabel] = useState(transition.label);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moveError, setMoveError] = useState<string>();
  const labelError = transitionError(diagram, { from: transition.from, to: transition.to, label }, transition.id);
  const name = (id: string) => diagram.states.find((state) => state.id === id)?.name ?? id;
  const suggested = transition.variant === "suggested";

  const commitLabel = () => {
    if (!labelError && label.trim() !== transition.label) {
      onEdit({ op: "update-transition", transitionId: transition.id, label });
    }
  };
  const move = (change: { from?: string; to?: string }) => {
    const error = transitionError(
      diagram,
      { from: change.from ?? transition.from, to: change.to ?? transition.to, label: transition.label },
      transition.id,
    );
    setMoveError(error ?? undefined);
    if (!error) onEdit({ op: "update-transition", transitionId: transition.id, ...change });
  };

  return (
    <section aria-label={`Transición ${transition.label}`}>
      <BackButton onClick={() => onSelect(null)} />
      <InspectorHeader eyebrow="Transición seleccionada" title={`${name(transition.from)} → ${name(transition.to)}`} />
      {suggested ? (
        <InspectorSection>
          <p className="text-meta/[1.45] text-muted">
            Es una transición sugerida por el diseño hacia un estado propuesto. Agrega el estado al flujo para poder
            configurarla.
          </p>
        </InspectorSection>
      ) : (
        <>
          <InspectorSection title="Datos">
            <div className="space-y-2">
              <label className={labelClass}>
                Acción
                <input
                  className={inputClass}
                  value={label}
                  maxLength={60}
                  disabled={readOnly}
                  onChange={(event) => setLabel(event.target.value)}
                  onBlur={commitLabel}
                  onKeyDown={(event) => event.key === "Enter" && commitLabel()}
                />
              </label>
              {labelError && <FieldError>{labelError}</FieldError>}
              <StateSelect
                label="Desde"
                diagram={diagram}
                value={transition.from}
                disabled={readOnly}
                onChange={(from) => move({ from })}
              />
              <StateSelect
                label="Hacia"
                diagram={diagram}
                value={transition.to}
                disabled={readOnly}
                onChange={(to) => move({ to })}
              />
              {moveError && <FieldError>{moveError}</FieldError>}
            </div>
          </InspectorSection>
          <InspectorSection title="Permisos">
            <RoleSelect
              value={transition.role}
              disabled={readOnly}
              onChange={(role) => onEdit({ op: "update-transition", transitionId: transition.id, role })}
            />
            <p className="mt-1.5 text-label text-muted">
              Segregación de funciones: quien documenta el hallazgo (Auditor) no debe aprobarlo ni cerrarlo.
            </p>
          </InspectorSection>
          <InspectorSection title="Condiciones para ejecutarla">
            <ul className="space-y-2">
              {REQUIREMENTS.map((requirement) => (
                <li key={requirement.id}>
                  <label className="flex items-start gap-2 text-body-sm text-ink-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-accent"
                      checked={transition.requires?.[requirement.id] === true}
                      disabled={readOnly}
                      onChange={(event) =>
                        onEdit({
                          op: "set-transition-requirement",
                          transitionId: transition.id,
                          requirement: requirement.id,
                          value: event.target.checked,
                        })
                      }
                    />
                    <span>
                      {requirement.label}
                      <span className="block text-label text-muted">{requirement.help}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </InspectorSection>
        </>
      )}
      {!readOnly && !suggested && (
        <InspectorSection>
          {confirmDelete ? (
            <div role="alert" className="rounded border border-red-line bg-red-bg p-2 text-label text-red">
              Se eliminará la transición «{transition.label}».
              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onEdit({ op: "remove-transition", transitionId: transition.id });
                    onSelect(null);
                  }}
                >
                  Sí, eliminar
                </Button>
                <Button size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
              Eliminar transición
            </Button>
          )}
        </InspectorSection>
      )}
    </section>
  );
}

/* ---------- Estado sugerido por el diseño ---------- */

function SuggestedEditor({
  name,
  onBack,
  onAccept,
  onRemove,
  readOnly,
}: {
  name: string;
  onBack: () => void;
  onAccept: (kind: StateKind) => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  const [kind, setKind] = useState<StateKind>("Aprobación");
  return (
    <section aria-label={`Estado sugerido ${name}`}>
      <BackButton onClick={onBack} />
      <InspectorHeader eyebrow="Propuesto por el diseño" title={name} />
      <InspectorSection>
        <p className="text-meta/[1.45] text-muted">
          Este estado aparece punteado: todavía no es parte del flujo. Agrégalo si tu proceso lo necesita o quítalo.
        </p>
        {!readOnly && (
          <div className="mt-2.5 space-y-2">
            <KindSelect value={kind} onChange={setKind} />
            <div className="flex gap-1.5">
              <Button size="sm" variant="primary" className="flex-1" onClick={() => onAccept(kind)}>
                Agregar al flujo
              </Button>
              <Button size="sm" onClick={onRemove}>
                Quitar
              </Button>
            </div>
          </div>
        )}
      </InspectorSection>
    </section>
  );
}

/* ---------- Controles ---------- */

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 px-4 pt-2.5 text-label font-medium text-accent hover:underline"
    >
      <ArrowLeft aria-hidden size={13} /> Todos los estados y transiciones
    </button>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="text-label text-red">{children}</p>;
}

function KindSelect({
  value,
  onChange,
  disabled,
}: {
  value: StateKind;
  onChange: (kind: StateKind) => void;
  disabled?: boolean;
}) {
  const helpId = useId();
  const known = (STATE_KINDS as readonly string[]).includes(value);
  return (
    <label className={labelClass}>
      Tipo
      <select
        className={inputClass}
        value={value}
        disabled={disabled}
        aria-describedby={helpId}
        onChange={(event) => onChange(event.target.value as StateKind)}
      >
        {!known && <option value={value}>{value}</option>}
        {STATE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {kind}
          </option>
        ))}
      </select>
      <span id={helpId} className="mt-1 block text-label text-muted">
        {known ? STATE_KIND_HELP[value] : "Tipo de la plantilla anterior: elige uno de la lista."}
      </span>
    </label>
  );
}

function StateSelect({
  label,
  diagram,
  value,
  onChange,
  disabled,
}: {
  label: string;
  diagram: WorkflowDiagram;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        className={inputClass}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {diagram.states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
  allowEmpty = true,
}: {
  value: string | null;
  onChange: (role: string | null) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <label className={labelClass}>
      Rol que puede ejecutarla
      <select
        className={inputClass}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
      >
        {allowEmpty && <option value="">Sin asignar</option>}
        {WORKFLOW_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  );
}
