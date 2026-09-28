export type FindingStatus = "in-review" | "manager-validation" | "director-validation" | "closed";

export type Severity = "high" | "medium" | "low";

export type Finding = {
  id: string;
  title: string;
  /** Unidad de negocio y auditoría de origen. */
  context: string;
  status: FindingStatus;
  severity: Severity;
  /** Días esperando acción; `null` si ya no espera (ej. cerrado). */
  waitingDays: number | null;
};

export type InboxTab = "pending" | "delegated" | "completed";

export type InboxFilter = "all" | "needs-approval" | "overdue" | "high-severity";
