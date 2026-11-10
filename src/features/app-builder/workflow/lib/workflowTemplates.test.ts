import { describe, expect, it } from "vitest";
import { analyzeWorkflow } from "./workflowAssistant";
import { NODE_SIZE } from "./workflowLayout";
import { diagramFromOutline, WORKFLOW_TEMPLATES } from "./workflowTemplates";

describe("fase 3: plantillas y flujos generados", () => {
  it.each(WORKFLOW_TEMPLATES.map((template) => [template.name, template] as const))(
    "la plantilla «%s» no tiene inconsistencias ni estados encimados",
    (_name, template) => {
      const diagram = diagramFromOutline(template.outline);
      expect(analyzeWorkflow(diagram)).toEqual([]);
      for (const a of diagram.states) {
        for (const b of diagram.states) {
          if (a.id >= b.id) continue;
          const apart =
            Math.abs(a.position.x - b.position.x) >= NODE_SIZE.width ||
            Math.abs(a.position.y - b.position.y) >= NODE_SIZE.height;
          expect(apart, `${a.id} y ${b.id}`).toBe(true);
        }
      }
      expect(diagram.transitions.every((transition) => transition.path.startsWith("M"))).toBe(true);
      const right = Math.max(...diagram.states.map((state) => state.position.x + NODE_SIZE.width));
      expect(diagram.size.width).toBeGreaterThan(right);
    },
  );

  it("un flujo generado se acomoda: el inicial a la izquierda y los retornos abajo", () => {
    const diagram = diagramFromOutline({
      states: [
        { id: "a", name: "Borrador", kind: "Inicial" },
        { id: "b", name: "Revisión", kind: "Aprobación" },
        { id: "r", name: "Devuelto", kind: "Retorno" },
        { id: "c", name: "Cerrado", kind: "Final" },
      ],
      transitions: [
        { id: "t1", from: "a", to: "b", label: "enviar", role: "Auditor" },
        { id: "t2", from: "b", to: "r", label: "devolver", role: "Jefe de Auditoría" },
        { id: "t3", from: "r", to: "b", label: "reenviar", role: "Auditor" },
        { id: "t4", from: "b", to: "c", label: "cerrar", role: "Jefe de Auditoría" },
      ],
    });
    const position = (id: string) => diagram.states.find((state) => state.id === id)?.position;
    expect(position("a")?.x).toBeLessThan(position("b")?.x ?? 0);
    expect(position("r")?.y).toBeGreaterThan(position("b")?.y ?? 0);
    expect(diagram.transitions.find((transition) => transition.id === "t2")?.variant).toBe("rejected");
    // Las reglas sí proponen los controles que la IA no puso.
    expect(analyzeWorkflow(diagram).map((item) => item.rule)).toEqual([
      "return-without-comment",
      "close-without-evidence",
    ]);
  });
});
