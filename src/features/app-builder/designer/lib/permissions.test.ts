import { describe, expect, it } from "vitest";
import type { FieldPermissions } from "../types";
import { nextPermissionLevel, updatePermission } from "./permissions";

describe("nextPermissionLevel", () => {
  it("recorre edit → read → hidden → edit", () => {
    expect(nextPermissionLevel("edit")).toBe("read");
    expect(nextPermissionLevel("read")).toBe("hidden");
    expect(nextPermissionLevel("hidden")).toBe("edit");
  });
});

describe("updatePermission", () => {
  const matrix: FieldPermissions[] = [
    { fieldId: "a", fieldName: "Campo A", levels: { auditor: "edit" } },
    { fieldId: "b", fieldName: "Campo B", levels: { auditor: "read" } },
  ];

  it("cambia solo el campo y rol indicados sin mutar la matriz original", () => {
    const result = updatePermission(matrix, "a", "auditor", "hidden");

    expect(result[0].levels.auditor).toBe("hidden");
    expect(result[1]).toBe(matrix[1]);
    expect(matrix[0].levels.auditor).toBe("edit");
  });
});
