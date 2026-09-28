import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/shared/ui";
import type { FieldPermissions, PermissionLevel, Role, RoleId } from "../types";
import { PermissionToggle } from "./PermissionToggle";

type PermissionMatrixProps = {
  roles: readonly Role[];
  permissions: readonly FieldPermissions[];
  onPermissionChange: (fieldId: string, roleId: RoleId, level: PermissionLevel) => void;
};

/** Matriz campo × rol. Las columnas se generan a partir de los roles recibidos. */
export function PermissionMatrix({ roles, permissions, onPermissionChange }: PermissionMatrixProps) {
  const columns = useMemo<DataTableColumn<FieldPermissions>[]>(
    () => [
      { id: "field", header: "Campo", render: (row) => row.fieldName },
      ...roles.map<DataTableColumn<FieldPermissions>>((role) => ({
        id: role.id,
        header: role.label,
        align: "center",
        render: (row) => (
          <PermissionToggle
            label={`${row.fieldName} · ${role.label}`}
            level={row.levels[role.id]}
            onChange={(level) => onPermissionChange(row.fieldId, role.id, level)}
          />
        ),
      })),
    ],
    [roles, onPermissionChange],
  );

  return <DataTable columns={columns} rows={permissions} getRowKey={(row) => row.fieldId} />;
}
