import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, QueryState, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { workflowService } from "../services/workflowService";
import type { NotificationRule } from "../types";

const COLUMNS: readonly DataTableColumn<NotificationRule>[] = [
  { id: "event", header: "Evento", render: (rule) => rule.event },
  { id: "recipient", header: "Destinatario", render: (rule) => rule.recipient },
  { id: "channel", header: "Canal", render: (rule) => rule.channel },
  { id: "status", header: "Estado", render: (rule) => (rule.active ? "Activa" : "Inactiva") },
];

export function NotificationsPanel() {
  const query = useQuery(workflowService.listNotificationRules);

  return (
    <ContentArea>
      <SectionToolbar
        description="Avisos automáticos para responsables, aprobadores y áreas auditadas."
        action={<Button variant="primary">Nueva notificación</Button>}
      />
      <QueryState query={query}>
        {(rules) => <DataTable columns={COLUMNS} rows={rules} getRowKey={(rule) => rule.id} />}
      </QueryState>
    </ContentArea>
  );
}
