import type { BadgeTone } from "@/shared/ui";
import type { Finding, FindingStatus, InboxFilter, Severity } from "../types";

/** Días de espera a partir de los cuales un hallazgo se considera vencido. */
export const OVERDUE_THRESHOLD_DAYS = 7;

export const STATUS_CONFIG: Record<FindingStatus, { label: string; tone: BadgeTone }> = {
  "in-review": { label: "En revisión", tone: "amber" },
  "manager-validation": { label: "Validación jefatura", tone: "blue" },
  "director-validation": { label: "Validación dirección", tone: "blue" },
  closed: { label: "Cerrado", tone: "green" },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; barClassName: string }> = {
  high: { label: "Alta", barClassName: "bg-red" },
  medium: { label: "Media", barClassName: "bg-amber" },
  low: { label: "Baja", barClassName: "bg-muted-2" },
};

export function isOverdue(finding: Finding): boolean {
  return finding.waitingDays !== null && finding.waitingDays > OVERDUE_THRESHOLD_DAYS;
}

export function isClosed(finding: Finding): boolean {
  return finding.status === "closed";
}

export function formatWaiting(finding: Finding): string {
  if (finding.waitingDays === null) return "-";
  return `${finding.waitingDays} ${finding.waitingDays === 1 ? "día" : "días"}`;
}

/** Predicado por filtro. Un filtro nuevo solo requiere una entrada aquí. */
export const INBOX_FILTERS: Record<InboxFilter, { label: string; predicate: (finding: Finding) => boolean }> = {
  all: { label: "Todos", predicate: () => true },
  "needs-approval": {
    label: "Requieren aprobación",
    predicate: (finding) => finding.status === "manager-validation" || finding.status === "director-validation",
  },
  overdue: { label: "Vencidos", predicate: isOverdue },
  "high-severity": { label: "Severidad alta", predicate: (finding) => finding.severity === "high" },
};
