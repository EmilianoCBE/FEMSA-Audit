export type FindingStatus = "in-review" | "manager-validation" | "director-validation" | "closed";

export type Severity = "high" | "medium" | "low";

export type Finding = {
  id: string;
  title: string;
  businessUnit: string;
  auditName: string;
  status: FindingStatus;
  severity: Severity;
  /** Días esperando acción; `null` si ya no espera (ej. cerrado). */
  waitingDays: number | null;
};

export type InboxTab = "pending" | "delegated" | "completed";

export type InboxFilter = "all" | "needs-approval" | "overdue" | "high-severity";
