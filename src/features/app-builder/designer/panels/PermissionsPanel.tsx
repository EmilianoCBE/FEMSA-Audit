import { useCallback, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { ContentArea, QueryState, SectionToolbar } from "@/shared/ui";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { updatePermission } from "../lib/permissions";
import { designerService } from "../services/designerService";
import type { PermissionLevel, RoleId } from "../types";

// TODO(US13 - Magda Colunga): aplicar permisos predeterminados por rol y permitir habilitar/deshabilitar por módulo.
// TODO(US14 - Leonel): determinar usuario/rol autenticado y restringir funcionalidades no autorizadas.
export function PermissionsPanel() {
  const query = useQuery(designerService.getPermissionMatrix);
  const [saveError, setSaveError] = useState<string>();
  const { setData, reload } = query;

  /** Actualización optimista: se refleja al instante y se revierte si el servidor la rechaza. */
  const handlePermissionChange = useCallback(
    async (fieldId: string, roleId: RoleId, level: PermissionLevel) => {
      setSaveError(undefined);
      setData(
        (current) =>
          current && { ...current, permissions: updatePermission(current.permissions, fieldId, roleId, level) },
      );
      try {
        await designerService.updatePermission(fieldId, roleId, level);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "No se pudo guardar el permiso.");
        reload();
      }
    },
    [setData, reload],
  );

  return (
    <ContentArea>
      <SectionToolbar description="Matriz de permisos por rol para cada campo del formulario." />
      {saveError && (
        <div role="alert" className="mb-3 text-body-sm text-red">
          {saveError}
        </div>
      )}
      <QueryState query={query}>
        {({ roles, permissions }) => (
          <PermissionMatrix roles={roles} permissions={permissions} onPermissionChange={handlePermissionChange} />
        )}
      </QueryState>
    </ContentArea>
  );
}
