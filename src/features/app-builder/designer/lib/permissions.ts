import type { FieldPermissions, PermissionLevel, RoleId } from "../types";

/** Orden en el que se recorre un permiso al hacer clic sobre él. */
export const PERMISSION_CYCLE: readonly PermissionLevel[] = ["edit", "read", "hidden"];

export function nextPermissionLevel(level: PermissionLevel): PermissionLevel {
  const index = PERMISSION_CYCLE.indexOf(level);
  return PERMISSION_CYCLE[(index + 1) % PERMISSION_CYCLE.length];
}

/** Devuelve una nueva matriz con el permiso actualizado (inmutable). */
export function updatePermission(
  matrix: readonly FieldPermissions[],
  fieldId: string,
  roleId: RoleId,
  level: PermissionLevel,
): FieldPermissions[] {
  return matrix.map((row) => (row.fieldId === fieldId ? { ...row, levels: { ...row.levels, [roleId]: level } } : row));
}
