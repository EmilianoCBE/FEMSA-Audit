import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, QueryState, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { workflowService } from "../services/workflowService";
import type { WorkflowRule } from "../types";

const COLUMNS: readonly DataTableColumn<WorkflowRule>[] = [
  { id: "name", header: "Regla", render: (rule) => rule.name },
  { id: "condition", header: "Condición", render: (rule) => rule.condition },
  { id: "action", header: "Acción", render: (rule) => rule.action },
  { id: "status", header: "Estado", render: (rule) => (rule.active ? "Activa" : "Inactiva") },
];

export function RulesPanel() {
  const query = useQuery(workflowService.listRules);

  return (
    <ContentArea>
      <SectionToolbar
        description="Reglas que deciden cuándo un hallazgo puede avanzar dentro del flujo."
        action={<Button variant="primary">Nueva regla</Button>}
      />
      <QueryState query={query}>
        {(rules) => <DataTable columns={COLUMNS} rows={rules} getRowKey={(rule) => rule.id} />}
      </QueryState>
    </ContentArea>
  );
}
