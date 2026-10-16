import { describe, expect, it } from "vitest";
import { formatPublishedAt } from "./formatPublishedAt";

describe("formatPublishedAt", () => {
  it("muestra 'En edición' cuando no hay fecha", () => {
    expect(formatPublishedAt(null)).toBe("En edición");
  });

  it("formatea la fecha en UTC sin punto en el mes", () => {
    expect(formatPublishedAt("2026-08-10T00:00:00.000Z")).toMatch(/^10 ago\.? 2026$/);
    expect(formatPublishedAt("2026-08-10T00:00:00.000Z")).not.toContain(".");
  });
});
