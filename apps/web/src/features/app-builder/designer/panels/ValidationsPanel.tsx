import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, QueryState, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { designerService } from "../services/designerService";
import type { ValidationRule } from "../types";

const COLUMNS: readonly DataTableColumn<ValidationRule>[] = [
  { id: "field", header: "Campo", render: (rule) => rule.fieldName },
  { id: "condition", header: "Condición", render: (rule) => rule.condition },
  { id: "message", header: "Mensaje al usuario", render: (rule) => rule.message },
  { id: "active", header: "Activa", render: (rule) => (rule.active ? "Sí" : "No") },
  { id: "actions", render: () => <Button variant="link">Editar</Button> },
];

export function ValidationsPanel() {
  const query = useQuery(designerService.listValidationRules);

  return (
    <ContentArea>
      <SectionToolbar
        description="Reglas de captura que se evalúan al guardar el formulario."
        action={<Button variant="primary">Nueva validación</Button>}
      />
      <QueryState query={query}>
        {(rules) => <DataTable columns={COLUMNS} rows={rules} getRowKey={(rule) => rule.id} />}
      </QueryState>
    </ContentArea>
  );
}
