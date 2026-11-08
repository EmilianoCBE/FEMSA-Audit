import { httpClient } from "@/shared/api/httpClient";
import { formFieldsMock, validationRulesMock } from "../data/designer.mock";
import type {
  ElementoDesigner,
  FormField,
  PermissionLevel,
  PermissionMatrixData,
  PlantillaDesigner,
  RoleId,
  ValidationRule,
} from "../types";

type PlantillasDesignerResponse = {
  layouts: PlantillaDesigner[];
};

type PlantillaDesignerResponse = {
  layout: PlantillaDesigner;
};

/** Servicios del Designer y configuración de permisos por módulo. */
export const designerService = {
  listFields: async (_signal?: AbortSignal): Promise<FormField[]> => formFieldsMock,

  listPlantillasDesigner: async (signal?: AbortSignal): Promise<PlantillaDesigner[]> => {
    const response = await httpClient.get<PlantillasDesignerResponse>("/designer/layouts", signal);
    return response.layouts;
  },

  getPlantillaDesigner: async (plantillaDesignerId: string, signal?: AbortSignal): Promise<PlantillaDesigner> => {
    const response = await httpClient.get<PlantillaDesignerResponse>(
      `/designer/layouts/${encodeURIComponent(plantillaDesignerId)}`,
      signal,
    );
    return response.layout;
  },

  createPlantillaDesigner: async (name: string, elements: ElementoDesigner[] = []): Promise<PlantillaDesigner> => {
    const response = await httpClient.post<PlantillaDesignerResponse>("/designer/layouts", { name, elements });
    return response.layout;
  },

  saveCanvasDesigner: async (plantillaDesignerId: string, elements: ElementoDesigner[]): Promise<PlantillaDesigner> => {
    const response = await httpClient.put<PlantillaDesignerResponse>(
      `/designer/layouts/${encodeURIComponent(plantillaDesignerId)}/canvas`,
      { elements },
    );
    return response.layout;
  },

  getPermissionMatrix: (signal?: AbortSignal): Promise<PermissionMatrixData> =>
    httpClient.get<PermissionMatrixData>("/permissions", signal),

  updatePermission: (fieldId: string, roleId: RoleId, level: PermissionLevel) =>
    httpClient.put(`/permissions/${encodeURIComponent(roleId)}/${encodeURIComponent(fieldId)}`, { level }),

  listValidationRules: async (_signal?: AbortSignal): Promise<ValidationRule[]> => validationRulesMock,
};
