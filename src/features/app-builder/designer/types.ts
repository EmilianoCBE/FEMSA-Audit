export type FormFieldType = "short-text" | "long-text" | "catalog" | "calculated" | "date";

export type FieldRequirement = "required" | "optional" | "automatic";

export type FormField = {
  id: string;
  name: string;
  type: FormFieldType;
  requirement: FieldRequirement;
};

export type RoleId = "auditor" | "manager" | "director" | "auditee";

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

export type ValidationRule = {
  id: string;
  fieldName: string;
  condition: string;
  message: string;
  active: boolean;
};
