import { Button, ContentArea, DataTable, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { workflowRulesMock } from "../data/workflow.mock";
import type { WorkflowRule } from "../types";

const COLUMNS: readonly DataTableColumn<WorkflowRule>[] = [
  { id: "name", header: "Regla", render: (rule) => rule.name },
  { id: "condition", header: "Condición", render: (rule) => rule.condition },
  { id: "action", header: "Acción", render: (rule) => rule.action },
  { id: "status", header: "Estado", render: (rule) => (rule.active ? "Activa" : "Inactiva") },
];

export function RulesPanel() {
  return (
    <ContentArea>
      <SectionToolbar
        description="Reglas que deciden cuándo un hallazgo puede avanzar dentro del flujo."
        action={<Button variant="primary">Nueva regla</Button>}
      />
      <DataTable columns={COLUMNS} rows={workflowRulesMock} getRowKey={(rule) => rule.id} />
    </ContentArea>
  );
}
