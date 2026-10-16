import { cn } from "@/shared/lib/cn";
import { Button, DataTable, type DataTableColumn } from "@/shared/ui";
import { formatWaiting, isClosed, isOverdue } from "../lib/findings";
import type { Finding } from "../types";
import { FindingStatusBadge } from "./FindingStatusBadge";
import { SeverityIndicator } from "./SeverityIndicator";

type FindingsTableProps = {
  findings: readonly Finding[];
  onOpen?: (finding: Finding) => void;
};

export function FindingsTable({ findings, onOpen }: FindingsTableProps) {
  const columns: DataTableColumn<Finding>[] = [
    {
      id: "id",
      header: "ID",
      width: 88,
      className: "font-mono text-meta text-muted",
      render: (finding) => finding.id,
    },
    {
      id: "title",
      header: "Hallazgo",
      render: (finding) => (
        <>
          {finding.title}
          <div className="mt-0.5 text-meta text-muted">
            {finding.businessUnit} · {finding.auditName}
          </div>
        </>
      ),
    },
    { id: "status", header: "Estado", width: 150, render: (finding) => <FindingStatusBadge status={finding.status} /> },
    {
      id: "severity",
      header: "Severidad",
      width: 140,
      render: (finding) => <SeverityIndicator severity={finding.severity} />,
    },
    {
      id: "waiting",
      header: "Esperando",
      width: 110,
      render: (finding) => (
        <span className={cn("text-body-sm", isOverdue(finding) && "font-medium text-red")}>
          {formatWaiting(finding)}
        </span>
      ),
    },
    {
      id: "actions",
      width: 70,
      render: (finding) => (
        <Button variant="link" onClick={() => onOpen?.(finding)}>
          {isClosed(finding) ? "Ver" : "Abrir"}
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} rows={findings} getRowKey={(finding) => finding.id} />;
}
