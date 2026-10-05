export type FormFieldType = "short-text" | "long-text" | "catalog" | "calculated" | "date";

export type FieldRequirement = "required" | "optional" | "automatic";

export type FormField = {
  id: string;
  name: string;
  type: FormFieldType;
  requirement: FieldRequirement;
};

/** Código del rol (ej. "auditor"). Los roles se administran en base de datos. */
export type RoleId = string;

export type Role = {
  id: RoleId;
  label: string;
};

export type PermissionLevel = "edit" | "read" | "hidden";

/** Permisos de un campo del formulario para cada rol. */
export type FieldPermissions = {
  fieldId: string;
  fieldName: string;
  levels: Record<RoleId, PermissionLevel>;
};

export type PermissionMatrixData = {
  roles: Role[];
  permissions: FieldPermissions[];
};

export type ValidationRule = {
  id: string;
  fieldName: string;
  condition: string;
  message: string;
  active: boolean;
};

export type ElementoDesigner = {
  id: string;
  type: FormFieldType | "number" | "section";
  x: number;
  y: number;
  width: number;
  height: number;
  config: {
    label?: string;
    required?: boolean;
    [key: string]: unknown;
  };
};

export type PlantillaDesigner = {
  id: string;
  name: string;
  elements: ElementoDesigner[];
  createdAt: string;
  updatedAt: string;
};
