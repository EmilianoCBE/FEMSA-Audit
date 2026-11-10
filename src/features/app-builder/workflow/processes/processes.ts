import type { ActionPlan, ProcessAction, ProcessSummary } from "./types";

// Fase 4 del workflow: textos y validaciones de los procesos (funciones puras).

/** "Vencido: 8 días (plazo 5)", "3 de 10 días" o `null` si el estado no tiene plazo. */
export function timingLabel(process: Pick<ProcessSummary, "daysInState" | "slaDays" | "overdue" | "status">) {
  if (process.status !== "active" || process.slaDays === null) return null;
  return process.overdue
    ? `Vencido: ${process.daysInState} días (plazo ${process.slaDays})`
    : `${process.daysInState} de ${process.slaDays} días`;
}

/** Aviso al publicar: los procesos en curso siguen con su versión hasta terminar. */
export function runningProcessesNotice(
  activeByVersion: readonly { versionNumber: number; active: number }[],
  newVersion: string,
): string | null {
  const total = activeByVersion.reduce((sum, item) => sum + item.active, 0);
  if (total === 0) return null;
  const detail = activeByVersion.map((item) => `${item.active} con v${item.versionNumber}`).join(", ");
  return (
    `${total} ${total === 1 ? "proceso en curso seguirá" : "procesos en curso seguirán"} con su versión hasta ` +
    `terminar (${detail}); los nuevos usarán ${newVersion}.`
  );
}

export type ActionInput = { comment: string; evidence: string; plan: ActionPlan };

/** Primer dato que falta para ejecutar la acción (lo mismo que valida el back), o `null`. */
export function missingForAction(action: ProcessAction, input: ActionInput, today = new Date()): string | null {
  if (action.requires.comment && !input.comment.trim()) return "Escribe el comentario.";
  if (action.requires.evidence && !input.evidence.trim()) return "Indica la evidencia (enlace o nombre del documento).";
  if (action.requires.actionPlan) {
    const { description, owner, dueDate } = input.plan;
    if (!description.trim() || !owner.trim() || !dueDate) return "Completa el plan de acción.";
    if (dueDate < today.toISOString().slice(0, 10)) return "La fecha compromiso no puede estar en el pasado.";
  }
  return null;
}
