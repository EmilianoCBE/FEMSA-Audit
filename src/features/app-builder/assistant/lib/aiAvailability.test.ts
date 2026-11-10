import { describe, expect, it } from "vitest";
import { aiUnavailableMessage, assistantErrorMessage, MANUAL_STILL_WORKS } from "./aiAvailability";

describe("US18 mensajes cuando la IA no está disponible", () => {
  it("cada motivo explica qué pasó y que la edición manual sigue", () => {
    const messages = [
      aiUnavailableMessage("not-configured"),
      aiUnavailableMessage("timeout"),
      aiUnavailableMessage("error"),
      aiUnavailableMessage("paused"),
      aiUnavailableMessage(null),
    ];
    expect(messages[0]).toMatch(/no está configurada/);
    expect(messages[1]).toMatch(/tardó demasiado/);
    expect(messages[2]).toMatch(/no está disponible/);
    expect(messages[3]).toMatch(/falló hace poco/);
    for (const message of messages) expect(message).toContain(MANUAL_STILL_WORKS);
  });

  it("dice a partir de qué hora se vuelve a intentar", () => {
    const retryAt = new Date(2026, 10, 9, 14, 5).toISOString();
    expect(aiUnavailableMessage("paused", retryAt)).toContain("a partir de las 14:05");
    expect(aiUnavailableMessage("not-configured", retryAt)).not.toContain("14:05");
  });

  it("distingue cuando el navegador dejó de esperar", () => {
    expect(assistantErrorMessage(new DOMException("", "TimeoutError"))).toMatch(/^El asistente tardó demasiado/);
    expect(assistantErrorMessage(new Error("500"))).toMatch(/^El asistente no está disponible/);
    expect(assistantErrorMessage(new Error("500"))).toContain("Puedes seguir editando el formulario manualmente.");
  });
});
