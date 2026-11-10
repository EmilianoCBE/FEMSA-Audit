import { describe, expect, it } from "vitest";
import { missingForAction, runningProcessesNotice, timingLabel } from "./processes";
import type { ProcessAction } from "./types";

const action = (requires: ProcessAction["requires"]): ProcessAction => ({
  transitionId: "t",
  label: "cerrar",
  toStateId: "c",
  toStateName: "Cerrado",
  role: "Jefe de Auditoría",
  requires,
  allowed: true,
  reason: null,
});
const empty = { comment: "", evidence: "", plan: { description: "", owner: "", dueDate: "" } };

describe("fase 4: procesos", () => {
  it("dice cuánto lleva en el estado y si se venció", () => {
    expect(timingLabel({ status: "active", daysInState: 8, slaDays: 5, overdue: true })).toBe(
      "Vencido: 8 días (plazo 5)",
    );
    expect(timingLabel({ status: "active", daysInState: 3, slaDays: 10, overdue: false })).toBe("3 de 10 días");
    expect(timingLabel({ status: "active", daysInState: 3, slaDays: null, overdue: false })).toBeNull();
    expect(timingLabel({ status: "completed", daysInState: 3, slaDays: 5, overdue: false })).toBeNull();
  });

  it("al publicar avisa que los procesos en curso siguen con su versión", () => {
    expect(runningProcessesNotice([], "v5")).toBeNull();
    expect(
      runningProcessesNotice(
        [
          { versionNumber: 3, active: 1 },
          { versionNumber: 4, active: 2 },
        ],
        "v5",
      ),
    ).toBe("3 procesos en curso seguirán con su versión hasta terminar (1 con v3, 2 con v4); los nuevos usarán v5.");
  });

  it("pide lo que exige la transición antes de enviarla", () => {
    expect(missingForAction(action({}), empty)).toBeNull();
    expect(missingForAction(action({ comment: true }), empty)).toBe("Escribe el comentario.");
    expect(missingForAction(action({ evidence: true }), { ...empty, evidence: "acta.pdf" })).toBeNull();
    const plan = { description: "Bloquear pagos", owner: "Raúl", dueDate: "2020-01-01" };
    expect(missingForAction(action({ actionPlan: true }), { ...empty, plan })).toMatch(/pasado/);
    expect(
      missingForAction(action({ actionPlan: true }), { ...empty, plan: { ...plan, dueDate: "2099-01-01" } }),
    ).toBeNull();
  });
});
