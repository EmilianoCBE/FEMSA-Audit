import { useCallback, useState } from "react";
import { ContentArea, SectionToolbar } from "@/shared/ui";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { fieldPermissionsMock, rolesMock } from "../data/designer.mock";
import { updatePermission } from "../lib/permissions";
import type { PermissionLevel, RoleId } from "../types";

// TODO(US13 - Magda Colunga): aplicar permisos predeterminados por rol y permitir habilitar/deshabilitar por módulo.
// TODO(US14 - Leonel): determinar usuario/rol autenticado y restringir funcionalidades no autorizadas.
export function PermissionsPanel() {
  const [permissions, setPermissions] = useState(fieldPermissionsMock);

  const handlePermissionChange = useCallback((fieldId: string, roleId: RoleId, level: PermissionLevel) => {
    setPermissions((current) => updatePermission(current, fieldId, roleId, level));
  }, []);

  return (
    <ContentArea>
      <SectionToolbar description="Matriz de permisos por rol para cada campo del formulario." />
      <PermissionMatrix roles={rolesMock} permissions={permissions} onPermissionChange={handlePermissionChange} />
    </ContentArea>
  );
}
