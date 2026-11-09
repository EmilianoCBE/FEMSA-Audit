import { describe, expect, it } from "vitest";
import type { AppVersion } from "../types";
import { latestDraft } from "./latestDraft";

const version = (number: number, status: AppVersion["status"]): AppVersion => ({
  id: String(number),
  version: `v${number}`,
  publishedAt: status === "draft" ? null : "2026-10-01T00:00:00.000Z",
  status,
  author: "Juan",
  changes: ["Cambio"],
});

describe("latestDraft", () => {
  it("devuelve el borrador con el número de versión más alto", () => {
    const versions = [version(5, "current"), version(6, "draft"), version(8, "draft"), version(7, "archived")];
    expect(latestDraft(versions)?.version).toBe("v8");
  });

  it("ignora versiones vigentes y archivadas", () => {
    expect(latestDraft([version(3, "current"), version(2, "archived")])).toBeUndefined();
  });

  it("devuelve undefined si no hay versiones", () => {
    expect(latestDraft([])).toBeUndefined();
  });
});
