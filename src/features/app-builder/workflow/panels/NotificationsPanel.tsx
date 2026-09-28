import { Button, ContentArea, DataTable, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { notificationRulesMock } from "../data/workflow.mock";
import type { NotificationRule } from "../types";

const COLUMNS: readonly DataTableColumn<NotificationRule>[] = [
  { id: "event", header: "Evento", render: (rule) => rule.event },
  { id: "recipient", header: "Destinatario", render: (rule) => rule.recipient },
  { id: "channel", header: "Canal", render: (rule) => rule.channel },
  { id: "status", header: "Estado", render: (rule) => (rule.active ? "Activa" : "Inactiva") },
];

export function NotificationsPanel() {
  return (
    <ContentArea>
      <SectionToolbar
        description="Avisos automáticos para responsables, aprobadores y áreas auditadas."
        action={<Button variant="primary">Nueva notificación</Button>}
      />
      <DataTable columns={COLUMNS} rows={notificationRulesMock} getRowKey={(rule) => rule.id} />
    </ContentArea>
  );
}
