import { describe, expect, it } from "vitest";
import { findingLifecycleMock } from "../data/workflow.mock";
import type { WorkflowDiagram } from "../types";
import { applyWorkflowEdit, LIMITS, neighbors, slugId, stateNameError, transitionError } from "./workflowEditing";
import { NODE_SIZE } from "./workflowLayout";

const base = (): WorkflowDiagram => structuredClone(findingLifecycleMock);

describe("fase 2: edición manual del flujo", () => {
  it("agrega un estado con id legible, color por tipo y en un lugar libre", () => {
    const next = applyWorkflowEdit(base(), { op: "add-state", name: "Respuesta del área", kind: "En proceso" });
    const added = next.states.at(-1);
    expect(added).toMatchObject({ id: "respuesta-del-area", kind: "En proceso", tone: "amber" });
    for (const other of next.states.slice(0, -1)) {
      const apart =
        Math.abs(other.position.x - (added?.position.x ?? 0)) >= NODE_SIZE.width ||
        Math.abs(other.position.y - (added?.position.y ?? 0)) >= NODE_SIZE.height;
      expect(apart, other.id).toBe(true);
    }
    // Nombre repetido o vacío: no cambia nada.
    expect(applyWorkflowEdit(next, { op: "add-state", name: " respuesta DEL área ", kind: "Final" })).toBe(next);
    expect(stateNameError(next, "")).toBe("Escribe el nombre del estado.");
    expect(slugId("Validación dirección", ["validacion-direccion"])).toBe("validacion-direccion-2");
  });

  it("cambiar el tipo cambia el color y lo que llega a un Retorno se dibuja como rechazo", () => {
    const next = applyWorkflowEdit(base(), { op: "update-state", stateId: "closed", kind: "Retorno", slaDays: 5 });
    expect(next.states.find((state) => state.id === "closed")).toMatchObject({ tone: "red", slaDays: 5 });
    expect(next.transitions.find((transition) => transition.id === "close")?.variant).toBe("rejected");
    const cleared = applyWorkflowEdit(next, { op: "update-state", stateId: "closed", slaDays: null });
    expect(cleared.states.find((state) => state.id === "closed")).not.toHaveProperty("slaDays");
  });

  it("eliminar un estado quita sus transiciones; mover vuelve a trazar solo las suyas", () => {
    const removed = applyWorkflowEdit(base(), { op: "remove-state", stateId: "rejected" });
    expect(removed.transitions.map((transition) => transition.id)).not.toContain("reject");
    expect(removed.transitions.map((transition) => transition.id)).not.toContain("return-to-review");

    const before = base();
    const moved = applyWorkflowEdit(before, { op: "move-state", stateId: "closed", position: { x: 833, y: 168 } });
    expect(moved.states.find((state) => state.id === "closed")?.position).toEqual({ x: 830, y: 170 });
    expect(moved.transitions.find((transition) => transition.id === "close")?.path).not.toBe(
      before.transitions.find((transition) => transition.id === "close")?.path,
    );
    expect(moved.transitions.find((transition) => transition.id === "send")?.path).toBe(
      before.transitions.find((transition) => transition.id === "send")?.path,
    );
  });

  it("una transición se edita sin romper el flujo (no a sí misma, no desde un final, no repetida)", () => {
    const d = base();
    expect(transitionError(d, { from: "closed", to: "draft", label: "reabrir" })).toMatch(/estado final/);
    expect(transitionError(d, { from: "draft", to: "draft", label: "x" })).toMatch(/otro estado/);
    expect(transitionError(d, { from: "draft", to: "in-review", label: "Enviar" })).toMatch(/misma transición/);
    expect(applyWorkflowEdit(d, { op: "update-transition", transitionId: "send", to: "draft" })).toBe(d);

    const next = applyWorkflowEdit(d, { op: "update-transition", transitionId: "close", role: "Jefe de Auditoría" });
    expect(next.transitions.find((transition) => transition.id === "close")?.role).toBe("Jefe de Auditoría");
  });

  it("un estado sugerido por el diseño se agrega al flujo con sus transiciones, o se quita", () => {
    const accepted = applyWorkflowEdit(base(), {
      op: "accept-suggested-state",
      stateId: "risk-acceptance",
      kind: "Final",
    });
    expect(accepted.suggestedStates).toEqual([]);
    expect(accepted.states.find((state) => state.id === "risk-acceptance")?.kind).toBe("Final");
    const link = accepted.transitions.find((transition) => transition.id === "suggested-risk");
    expect(link).toMatchObject({ variant: "default", label: "enviar", role: "Dirección de Auditoría" });

    const removed = applyWorkflowEdit(base(), { op: "remove-suggested-state", stateId: "risk-acceptance" });
    expect(removed.suggestedStates).toEqual([]);
    expect(removed.transitions.some((transition) => transition.id === "suggested-risk")).toBe(false);
    expect(removed.annotations).toEqual([]);
  });

  it("respeta los topes y muestra vecinos para navegar (US04)", () => {
    let d = base();
    for (let i = d.states.length; i < LIMITS.states; i++) {
      d = applyWorkflowEdit(d, { op: "add-state", name: `Estado ${i}`, kind: "En proceso" });
    }
    expect(d.states).toHaveLength(LIMITS.states);
    expect(applyWorkflowEdit(d, { op: "add-state", name: "Uno más", kind: "En proceso" })).toBe(d);

    const { incoming, outgoing } = neighbors(base(), "in-review");
    expect(incoming.map((item) => item.stateName)).toEqual(["Borrador", "Rechazado"]);
    expect(outgoing.map((item) => item.stateName)).toEqual(["Validación del responsable"]);
  });

  it("ordenar el diagrama no encima estados", () => {
    const d = applyWorkflowEdit(applyWorkflowEdit(base(), { op: "add-state", name: "Suelto", kind: "En proceso" }), {
      op: "auto-layout",
    });
    const keys = d.states.map((state) => `${state.position.x}:${state.position.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
