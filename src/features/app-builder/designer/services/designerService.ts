import { formFieldsMock, permissionMatrixMock, validationRulesMock } from "../data/designer.mock";
import type { FormField, PermissionLevel, PermissionMatrixData, RoleId, ValidationRule } from "../types";

/**
 * Por ahora devuelve datos mock (los cambios de permisos solo viven en memoria).
 * Cuando existan las tablas en Azure SQL, cada método se cambia por su llamada con httpClient,
 * ej. `listFields: (signal) => httpClient.get<FormField[]>("/designer/fields", signal)`.
 */
export const designerService = {
  listFields: async (_signal?: AbortSignal): Promise<FormField[]> => formFieldsMock,

  getPermissionMatrix: async (_signal?: AbortSignal): Promise<PermissionMatrixData> => permissionMatrixMock,

  updatePermission: async (fieldId: string, roleId: RoleId, level: PermissionLevel) => ({ fieldId, roleId, level }),

  listValidationRules: async (_signal?: AbortSignal): Promise<ValidationRule[]> => validationRulesMock,
};
