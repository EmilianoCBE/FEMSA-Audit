import { describe, expect, it } from "vitest";
import { findingLifecycleMock, workflowRulesMock } from "../data/workflow.mock";
import type { WorkflowDiagram, WorkflowRule } from "../types";
import {
  getActiveRules,
  getBranches,
  getMainSequence,
  getReferenceDiagram,
  getSequenceSummary,
  hasFlow,
  lowerFirst,
} from "./processSummary";

const emptyDiagram: WorkflowDiagram = { ...findingLifecycleMock, states: [] };

function rule(overrides: Partial<WorkflowRule> = {}): WorkflowRule {
  return { id: "r-1", name: "Regla", condition: "Al enviar", action: "Avisar", active: true, ...overrides };
}

describe("getMainSequence", () => {
  it("ordena los estados de la fila principal de izquierda a derecha", () => {
    expect(getMainSequence(findingLifecycleMock).map((state) => state.id)).toEqual([
      "draft",
      "in-review",
      "manager-validation",
      "director-validation",
      "closed",
    ]);
  });

  it("deja fuera los estados de retorno", () => {
    expect(getMainSequence(findingLifecycleMock).map((state) => state.id)).not.toContain("rejected");
  });
});

describe("getSequenceSummary", () => {
  it("une los nombres con flechas", () => {
    expect(getSequenceSummary(findingLifecycleMock)).toBe(
      "Borrador → En revisión → Validación del responsable → Validación dirección → Cerrado",
    );
  });
});

describe("getBranches", () => {
  it("detecta los desvíos y si regresan a la secuencia principal", () => {
    const branches = getBranches(findingLifecycleMock).map(({ id, from, to, returns }) => ({
      id,
      from: from.id,
      to: to.id,
      returns,
    }));
    expect(branches).toEqual([
      { id: "reject", from: "director-validation", to: "rejected", returns: false },
      { id: "return-to-review", from: "rejected", to: "in-review", returns: true },
    ]);
  });

  it("ignora la transición sugerida por la IA", () => {
    expect(getBranches(findingLifecycleMock).map((branch) => branch.id)).not.toContain("suggested-risk");
  });
});

describe("getReferenceDiagram", () => {
  it("quita las sugerencias y no resalta ninguna transición", () => {
    const { transitions } = getReferenceDiagram(findingLifecycleMock);
    expect(transitions.some((transition) => transition.variant === "suggested")).toBe(false);
    expect(transitions.some((transition) => transition.variant === "active")).toBe(false);
  });

  it("ajusta la altura al estado más bajo", () => {
    // Rechazado está en y = 170 y mide 60 de alto, más 20 de margen
    expect(getReferenceDiagram(findingLifecycleMock).size.height).toBe(250);
  });
});

describe("getActiveRules", () => {
  it("muestra solo las reglas activas", () => {
    const rules = [rule({ id: "on" }), rule({ id: "off", active: false })];
    expect(getActiveRules(findingLifecycleMock, rules).map((r) => r.id)).toEqual(["on"]);
  });
});

describe("sin flujo configurado", () => {
  it("no hay flujo, secuencia, desvíos ni reglas", () => {
    expect(hasFlow(emptyDiagram)).toBe(false);
    expect(getSequenceSummary(emptyDiagram)).toBe("");
    expect(getBranches(emptyDiagram)).toEqual([]);
    expect(getActiveRules(emptyDiagram, workflowRulesMock)).toEqual([]);
  });

  it("el diagrama vacío tiene una altura válida", () => {
    expect(getReferenceDiagram(emptyDiagram).size.height).toBe(20);
  });
});

describe("lowerFirst", () => {
  it("pone en minúscula solo la primera letra", () => {
    expect(lowerFirst("Bloquear avance")).toBe("bloquear avance");
    expect(lowerFirst("")).toBe("");
  });
});
