import { describe, expect, it } from "vitest";
import { formatDateTime, formatPublishedAt } from "./formatPublishedAt";

describe("formatPublishedAt", () => {
  it("muestra 'En edición' cuando no hay fecha", () => {
    expect(formatPublishedAt(null)).toBe("En edición");
  });

  it("formatea la fecha sin punto en el mes", () => {
    expect(formatPublishedAt("2026-08-10T12:00:00.000Z", "UTC")).toBe("10 ago 2026");
  });

  it("usa la zona horaria local: de noche en México sigue siendo el mismo día", () => {
    // 19:00 del 18 de octubre en Ciudad de México = 01:00 del 19 en UTC.
    expect(formatPublishedAt("2026-10-19T01:00:00.000Z", "America/Mexico_City")).toBe("18 oct 2026");
  });
});

describe("formatDateTime", () => {
  it("incluye la hora en formato de 24 horas", () => {
    expect(formatDateTime("2026-10-19T01:05:00.000Z", "America/Mexico_City")).toMatch(/^18 oct 2026,? 19:05$/);
  });
});
