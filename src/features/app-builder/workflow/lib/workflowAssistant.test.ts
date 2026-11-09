import { describe, expect, it } from "vitest";
import { findingLifecycleMock } from "../data/workflow.mock";
import type { WorkflowDiagram, WorkflowState, WorkflowTransition } from "../types";
import { analyzeWorkflow, applyWorkflowChange, pathMidpoint, suggestionWarnings } from "./workflowAssistant";

const state = (id: string, kind: string, x: number, y = 20): WorkflowState => ({
  id,
  kind,
  name: id,
  tone: "neutral",
  position: { x, y },
});

const transition = (id: string, from: string, to: string, role: string | null = "Auditor"): WorkflowTransition => ({
  id,
  label: id,
  from,
  to,
  role,
  path: "M0 0 L1 1",
  labelPosition: { x: 50, y: 50 },
  variant: "default",
});

const diagram = (states: WorkflowState[], transitions: WorkflowTransition[]): WorkflowDiagram => ({
  size: { width: 800, height: 300 },
  states,
  transitions,
  warnings: [],
  suggestedStates: [],
  annotations: [],
});

const base = () =>
  diagram(
    [state("a", "Inicial", 0), state("b", "En proceso", 200), state("c", "Final", 400)],
    [transition("ab", "a", "b"), transition("bc", "b", "c")],
  );

const rules = (d: WorkflowDiagram) => analyzeWorkflow(d).map((suggestion) => suggestion.id);

describe("US16 reglas del workflow", () => {
  it("un flujo bien formado no tiene inconsistencias", () => {
    expect(analyzeWorkflow(base())).toEqual([]);
  });

  it("detecta un estado inalcanzable y propone conectarlo desde el inicial", () => {
    const d = base();
    const [suggestion] = analyzeWorkflow({ ...d, states: [...d.states, state("x", "Aprobación", 0, 170)] }).filter(
      (item) => item.rule === "unreachable-state",
    );
    expect(suggestion.target).toEqual({ type: "state", id: "x" });
    expect(suggestion.reason).toMatch(/Ninguna transición llega/);
    expect(suggestion.change).toEqual({
      op: "add-transition",
      from: "a",
      to: "x",
      label: "mover",
      role: "Jefe de Auditoría",
    });
  });

  it("detecta un estado sin salida y propone cerrarlo hacia el estado final", () => {
    const d = base();
    const result = analyzeWorkflow({
      ...d,
      states: [...d.states, state("r", "Retorno", 200, 170)],
      transitions: [...d.transitions, transition("br", "b", "r")],
    });
    expect(result.map((item) => item.id)).toEqual(["dead-end-state:r"]);
    expect(result[0].change).toMatchObject({ op: "add-transition", from: "r", to: "c" });
  });

  it("avisa si no hay estado final, sin proponer un cambio automático", () => {
    const d = base();
    const result = analyzeWorkflow({ ...d, states: d.states.map((item) => ({ ...item, kind: "En proceso" })) });
    const missing = result.find((item) => item.rule === "missing-final-state");
    expect(missing?.change).toBeUndefined();
    expect(missing?.reason).toBeTruthy();
  });

  it("detecta transiciones sin rol y propone uno según el paso", () => {
    const d = base();
    const result = analyzeWorkflow({
      ...d,
      transitions: [transition("ab", "a", "b"), transition("bc", "b", "c", null)],
    });
    expect(result).toHaveLength(1);
    expect(result[0].change).toEqual({
      op: "set-transition-role",
      transitionId: "bc",
      role: "Dirección de Auditoría",
    });
  });

  it("detecta transiciones duplicadas y propone quitar la repetida", () => {
    const d = base();
    const duplicate = { ...transition("bc-2", "b", "c"), label: "BC " };
    const result = analyzeWorkflow({ ...d, transitions: [...d.transitions, duplicate] });
    expect(result.filter((item) => item.rule === "duplicate-transition").map((item) => item.change)).toEqual([
      { op: "remove-transition", transitionId: "bc-2" },
    ]);
  });

  it("detecta un ciclo sin salida y propone cerrarlo hacia el estado final", () => {
    const d = diagram(
      [
        state("a", "Inicial", 0),
        state("b", "En proceso", 200),
        state("r", "Retorno", 200, 170),
        state("c", "Final", 400),
      ],
      [transition("ab", "a", "b"), transition("br", "b", "r"), transition("rb", "r", "b")],
    );
    const cycles = analyzeWorkflow(d).filter((item) => item.rule === "cycle-without-exit");
    expect(cycles).toHaveLength(1);
    expect(cycles[0].title).toBe("Ciclo sin salida entre «b», «r»");
    expect(cycles[0].reason).toMatch(/nunca podría cerrarse/);
    expect(cycles[0].target).toEqual({ type: "state", id: "b" });
    expect(cycles[0].change).toEqual({
      op: "add-transition",
      from: "r",
      to: "c",
      label: "cerrar",
      role: "Dirección de Auditoría",
    });
    // Al aceptar el cambio el ciclo ya tiene salida.
    const fixed = applyWorkflowChange(d, cycles[0].change as NonNullable<(typeof cycles)[0]["change"]>);
    expect(rules(fixed)).not.toContain("cycle-without-exit:b");
  });

  it("un ciclo con salida a un estado final no es inconsistencia", () => {
    const d = base();
    const withLoop = { ...d, transitions: [...d.transitions, transition("ba", "b", "a")] };
    expect(analyzeWorkflow(withLoop)).toEqual([]);
  });

  it("no repite el ciclo si desemboca en un estado sin salida (esa regla ya lo arregla)", () => {
    const d = diagram(
      [
        state("a", "Inicial", 0),
        state("b", "En proceso", 200),
        state("x", "En proceso", 200, 170),
        state("c", "Final", 400),
      ],
      [transition("ab", "a", "b"), transition("ba", "b", "a"), transition("bx", "b", "x")],
    );
    expect(rules(d)).toContain("dead-end-state:x");
    expect(rules(d).some((id) => id.startsWith("cycle-without-exit"))).toBe(false);
  });

  it("las transiciones sugeridas no cuentan hasta aceptarlas", () => {
    const d = base();
    const result = rules({
      ...d,
      transitions: [...d.transitions, { ...transition("bx", "b", "x", null), variant: "suggested" as const }],
    });
    expect(result).toEqual([]);
  });

  it("toda sugerencia del flujo de ejemplo explica el motivo y se marca en el diagrama", () => {
    const suggestions = analyzeWorkflow(findingLifecycleMock);
    expect(suggestions.map((item) => item.id)).toEqual([
      "transition-without-role:close",
      "transition-without-role:return-to-review",
    ]);
    expect(suggestions.every((item) => item.reason.length > 0)).toBe(true);
    expect(suggestionWarnings(findingLifecycleMock, suggestions)).toHaveLength(2);
  });
});

describe("US17 aplicar un cambio aceptado del workflow", () => {
  it("asigna el rol sin modificar el resto ni el diagrama original", () => {
    const d = base();
    const next = applyWorkflowChange(d, { op: "set-transition-role", transitionId: "bc", role: "Jefe de Auditoría" });
    expect(next.transitions[1].role).toBe("Jefe de Auditoría");
    expect(d.transitions[1].role).toBe("Auditor");
    expect(next.transitions[0]).toBe(d.transitions[0]);
  });

  it("agrega una transición con trazo y quita la inconsistencia", () => {
    const d = base();
    const withState = { ...d, states: [...d.states, state("x", "Aprobación", 200, 170)] };
    const next = applyWorkflowChange(withState, {
      op: "add-transition",
      from: "b",
      to: "x",
      label: "escalar",
      role: "Auditor",
    });
    const added = next.transitions.at(-1);
    expect(added).toMatchObject({ id: "b-x", from: "b", to: "x", label: "escalar", variant: "default" });
    expect(added?.path).toMatch(/^M/);
    expect(rules(next)).not.toContain("unreachable-state:x");
  });

  it("quita una transición", () => {
    const next = applyWorkflowChange(base(), { op: "remove-transition", transitionId: "ab" });
    expect(next.transitions.map((item) => item.id)).toEqual(["bc"]);
  });

  it("ignora cambios que ya no corresponden", () => {
    const d = base();
    expect(applyWorkflowChange(d, { op: "remove-transition", transitionId: "zz" })).toBe(d);
    expect(applyWorkflowChange(d, { op: "add-transition", from: "a", to: "zz", label: "x", role: "Auditor" })).toBe(d);
    expect(applyWorkflowChange(d, { op: "set-transition-role", transitionId: "zz", role: "Auditor" })).toBe(d);
  });
});

describe("marcas del diagrama", () => {
  it("la marca de una transición va a la mitad de su recorrido", () => {
    expect(pathMidpoint("M0 0 L10 0")).toEqual({ x: 5, y: 0 });
    expect(pathMidpoint("M614 198 L298 198 L298 82")).toEqual({ x: 398, y: 198 });
    expect(pathMidpoint("M1 1")).toBeNull();
  });
});
