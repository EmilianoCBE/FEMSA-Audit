import { Button, ContentArea, DataTable, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { validationRulesMock } from "../data/designer.mock";
import type { ValidationRule } from "../types";

const COLUMNS: readonly DataTableColumn<ValidationRule>[] = [
  { id: "field", header: "Campo", render: (rule) => rule.fieldName },
  { id: "condition", header: "Condición", render: (rule) => rule.condition },
  { id: "message", header: "Mensaje al usuario", render: (rule) => rule.message },
  { id: "active", header: "Activa", render: (rule) => (rule.active ? "Sí" : "No") },
  { id: "actions", render: () => <Button variant="link">Editar</Button> },
];

export function ValidationsPanel() {
  return (
    <ContentArea>
      <SectionToolbar
        description="Reglas de captura que se evalúan al guardar el formulario."
        action={<Button variant="primary">Nueva validación</Button>}
      />
      <DataTable columns={COLUMNS} rows={validationRulesMock} getRowKey={(rule) => rule.id} />
    </ContentArea>
  );
}
