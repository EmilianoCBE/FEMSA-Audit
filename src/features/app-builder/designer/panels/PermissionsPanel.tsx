import { usePermissions } from "@/features/auth/permissions";
import { useCallback, useRef, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { ContentArea, QueryState, SectionToolbar } from "@/shared/ui";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { updatePermission } from "../lib/permissions";
import { designerService } from "../services/designerService";
import type { PermissionLevel, RoleId } from "../types";

export function PermissionsPanel() {
  const { refresh } = usePermissions();
  const saving = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const query = useQuery(designerService.getPermissionMatrix);
  const [saveError, setSaveError] = useState<string>();
  const { setData, reload } = query;

  /** Actualización optimista: se refleja al instante y se revierte si el servidor la rechaza. */
  const handlePermissionChange = useCallback(
    async (fieldId: string, roleId: RoleId, level: PermissionLevel) => {
      if (saving.current) return;
      saving.current = true;
      setIsSaving(true);
      setSaved(false);
      setSaveError(undefined);
      setData(
        (current) =>
          current && { ...current, permissions: updatePermission(current.permissions, fieldId, roleId, level) },
      );
      try {
        await designerService.updatePermission(fieldId, roleId, level);
        setSaved(true);
        await refresh();
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "No se pudo guardar el permiso.");
        reload();
      } finally {
        saving.current = false;
        setIsSaving(false);
      }
    },
    [setData, reload, refresh],
  );

  return (
    <ContentArea>
      <SectionToolbar description="Permisos predeterminados por rol y módulo. Los cambios se aplican a todos los usuarios del rol." />
      {saveError && (
        <div role="alert" className="mb-3 text-body-sm text-red">
          {saveError}
        </div>
      )}
      <p className="mb-3 text-sm text-muted">
        Edición permite consultar y guardar; Lectura permite consultar; Oculto bloquea el acceso. Los administradores
        conservan acceso completo.
      </p>
      {saved && (
        <p role="status" className="mb-3 text-sm">
          Permiso guardado correctamente.
        </p>
      )}
      <fieldset disabled={isSaving} aria-busy={isSaving}>
        <legend className="sr-only">Permisos por módulo</legend>
        <QueryState query={query}>
          {({ roles, permissions }) => (
            <PermissionMatrix roles={roles} permissions={permissions} onPermissionChange={handlePermissionChange} />
          )}
        </QueryState>
      </fieldset>
    </ContentArea>
  );
}
