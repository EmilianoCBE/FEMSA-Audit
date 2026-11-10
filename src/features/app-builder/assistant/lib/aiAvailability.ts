import type { AiUnavailableReason } from "../types";

// US18 - Continuidad sin IA (Karla Alessandra; implementación inicial: Emiliano Carrizales).
// Cada mensaje dice por qué no hay IA y qué sigue funcionando: las revisiones automáticas y la edición manual.

/** Lo que siempre sigue disponible aunque la IA no responda (US18, criterio 3). */
export const MANUAL_STILL_WORKS = "Las revisiones automáticas y la edición manual del formulario siguen funcionando.";

/** Límite del lado del navegador: si el servidor no contesta en este tiempo se deja de esperar. */
export const ANALYZE_TIMEOUT_MS = 20_000;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

export function aiUnavailableMessage(reason: AiUnavailableReason | null | undefined, retryAt?: string | null): string {
  const retry = retryAt ? ` Se volverá a intentar a partir de las ${formatTime(retryAt)}.` : "";
  switch (reason) {
    case "not-configured":
      return `La IA no está configurada en el servidor. ${MANUAL_STILL_WORKS}`;
    case "timeout":
      return `La IA tardó demasiado en responder.${retry} ${MANUAL_STILL_WORKS}`;
    case "paused":
      return `La IA falló hace poco y está en pausa.${retry} ${MANUAL_STILL_WORKS}`;
    default:
      return `La IA no está disponible en este momento.${retry} ${MANUAL_STILL_WORKS}`;
  }
}

/** Mensaje cuando ni siquiera respondió el asistente (servidor caído, sin red o el navegador dejó de esperar). */
export function assistantErrorMessage(error: unknown, subject = "el formulario"): string {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  const cause = timedOut
    ? "El asistente tardó demasiado en responder."
    : "El asistente no está disponible en este momento.";
  return `${cause} Puedes seguir editando ${subject} manualmente.`;
}
