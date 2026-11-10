import { describe, expect, it } from "vitest";
import { findingLifecycleMock } from "../data/workflow.mock";
import { applyWorkflowChange } from "./workflowAssistant";
import {
  DEFAULT_WORKFLOW,
  describeWorkflowChanges,
  fromStoredWorkflow,
  sameWorkflow,
  toStoredWorkflow,
} from "./workflowStorage";

describe("flujo guardado por formulario", () => {
  it("guarda el diagrama sin las marcas calculadas y sin formulario guardado usa la plantilla base", () => {
    const stored = toStoredWorkflow({
      ...findingLifecycleMock,
      warnings: [{ id: "w", message: "!", position: { x: 0, y: 0 } }],
    });
    expect(stored).not.toHaveProperty("warnings");
    expect(fromStoredWorkflow(null)).toEqual({ ...DEFAULT_WORKFLOW, warnings: [] });
    expect(fromStoredWorkflow(stored).states).toEqual(findingLifecycleMock.states);
  });

  it("calcula el trazo de las transiciones que no lo traen guardado", () => {
    const { path: _path, labelPosition: _label, ...bare } = DEFAULT_WORKFLOW.transitions[0];
    const diagram = fromStoredWorkflow({ ...DEFAULT_WORKFLOW, transitions: [bare] });
    expect(diagram.transitions[0].path).toMatch(/^M\d/);
    expect(diagram.transitions[0].labelPosition).toEqual(expect.objectContaining({ x: expect.any(Number) }));
  });

  it("compara flujos sin importar el orden de las llaves", () => {
    const reordered = JSON.parse(JSON.stringify(DEFAULT_WORKFLOW, Object.keys(DEFAULT_WORKFLOW).reverse()));
    expect(sameWorkflow(DEFAULT_WORKFLOW, { ...reordered, ...DEFAULT_WORKFLOW })).toBe(true);
    expect(sameWorkflow(DEFAULT_WORKFLOW, null)).toBe(false);
    expect(sameWorkflow(null, undefined)).toBe(true);
  });

  it("resume qué cambió en el flujo", () => {
    const withRole = toStoredWorkflow(
      applyWorkflowChange(fromStoredWorkflow(DEFAULT_WORKFLOW), {
        op: "set-transition-role",
        transitionId: "close",
        role: "Dirección de Auditoría",
      }),
    );
    expect(describeWorkflowChanges(DEFAULT_WORKFLOW, withRole)).toEqual([
      "La transición «cerrar» ahora la ejecuta Dirección de Auditoría",
    ]);
    const withTransition = toStoredWorkflow(
      applyWorkflowChange(fromStoredWorkflow(DEFAULT_WORKFLOW), {
        op: "add-transition",
        from: "manager-validation",
        to: "in-review",
        label: "devolver",
        role: "Jefe de Auditoría",
      }),
    );
    expect(describeWorkflowChanges(DEFAULT_WORKFLOW, withTransition)).toEqual([
      "Se agregó la transición «devolver» de Validación del responsable a En revisión",
    ]);
    expect(describeWorkflowChanges(null, DEFAULT_WORKFLOW)).toEqual(["Se guardó el flujo del proceso"]);
    expect(describeWorkflowChanges(DEFAULT_WORKFLOW, DEFAULT_WORKFLOW)).toEqual([]);
    const moved = { ...DEFAULT_WORKFLOW, size: { width: 999, height: 999 } };
    expect(describeWorkflowChanges(DEFAULT_WORKFLOW, moved)).toEqual(["Se reacomodó el diagrama del flujo"]);
  });
});
