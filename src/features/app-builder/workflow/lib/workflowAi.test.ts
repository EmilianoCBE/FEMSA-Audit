import { describe, expect, it } from "vitest";
import { findingLifecycleMock } from "../data/workflow.mock";
import { buildWorkflowAiRequest, toWorkflowSuggestions } from "./workflowAi";
import { analyzeWorkflow, applyWorkflowChange } from "./workflowAssistant";

describe("US15 IA del workflow", () => {
  it("solo envía la estructura del flujo, sin las transiciones sugeridas del diseño (RNF-13)", () => {
    const request = buildWorkflowAiRequest(findingLifecycleMock, analyzeWorkflow(findingLifecycleMock));
    expect(Object.keys(request)).toEqual(["states", "transitions", "known"]);
    expect(Object.keys(request.states[0])).toEqual(["id", "name", "kind"]);
    expect(Object.keys(request.transitions[0])).toEqual(["id", "from", "to", "label", "role"]);
    expect(request.transitions.map((transition) => transition.id)).not.toContain("suggested-risk");
    expect(JSON.stringify(request)).not.toContain("position");
    expect(request.known.map((item) => item.title)).toEqual([
      "«cerrar» no tiene rol asignado",
      "«devolver a revisión» no tiene rol asignado",
    ]);
  });

  it("convierte las propuestas en sugerencias que se aplican como las de las reglas", () => {
    const [relation, observation] = toWorkflowSuggestions({
      aiAvailable: true,
      aiUnavailableReason: null,
      aiRetryAt: null,
      provider: "mock",
      promptVersion: "workflow-v1",
      latencyMs: 5,
      suggestions: [
        {
          id: "ai-workflow-1",
          kind: "relation",
          title: "Permitir devolver a revisión",
          reason: "Evita aprobar algo incompleto.",
          confidence: "media",
          target: { type: "state", id: "manager-validation" },
          change: {
            op: "add-transition",
            from: "manager-validation",
            to: "in-review",
            label: "devolver",
            role: "Jefe de Auditoría",
          },
        },
        {
          id: "ai-workflow-2",
          kind: "inconsistency",
          title: "Falta aceptación de riesgo",
          reason: "Paso de control.",
          confidence: "baja",
        },
      ],
    });
    expect(relation).toMatchObject({
      rule: "ai-relation",
      source: "ai",
      target: { type: "state", id: "manager-validation" },
    });
    expect(observation).toMatchObject({ rule: "ai-observation", source: "ai", target: null });
    expect(observation.change).toBeUndefined();

    const updated = applyWorkflowChange(findingLifecycleMock, relation.change as NonNullable<typeof relation.change>);
    expect(
      updated.transitions.some(
        (t) => t.from === "manager-validation" && t.to === "in-review" && t.role === "Jefe de Auditoría",
      ),
    ).toBe(true);
  });
});
