import { describe, expect, it } from "vitest";
import type { Finding } from "../types";
import { formatWaiting, INBOX_FILTERS, isClosed, isOverdue, OVERDUE_THRESHOLD_DAYS } from "./findings";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "H-1",
    title: "Hallazgo",
    businessUnit: "OXXO",
    auditName: "Auditoría",
    status: "in-review",
    severity: "medium",
    waitingDays: 1,
    ...overrides,
  };
}

describe("isOverdue", () => {
  it("es vencido solo cuando supera el umbral de días", () => {
    expect(isOverdue(finding({ waitingDays: OVERDUE_THRESHOLD_DAYS }))).toBe(false);
    expect(isOverdue(finding({ waitingDays: OVERDUE_THRESHOLD_DAYS + 1 }))).toBe(true);
  });

  it("un hallazgo sin espera no está vencido", () => {
    expect(isOverdue(finding({ waitingDays: null }))).toBe(false);
  });
});

describe("isClosed", () => {
  it("detecta el estado cerrado", () => {
    expect(isClosed(finding({ status: "closed" }))).toBe(true);
    expect(isClosed(finding({ status: "in-review" }))).toBe(false);
  });
});

describe("formatWaiting", () => {
  it("usa singular, plural y guion", () => {
    expect(formatWaiting(finding({ waitingDays: 1 }))).toBe("1 día");
    expect(formatWaiting(finding({ waitingDays: 3 }))).toBe("3 días");
    expect(formatWaiting(finding({ waitingDays: null }))).toBe("-");
  });
});

describe("INBOX_FILTERS", () => {
  it("'Requieren aprobación' incluye ambas validaciones", () => {
    const { predicate } = INBOX_FILTERS["needs-approval"];
    expect(predicate(finding({ status: "manager-validation" }))).toBe(true);
    expect(predicate(finding({ status: "director-validation" }))).toBe(true);
    expect(predicate(finding({ status: "in-review" }))).toBe(false);
  });

  it("'Severidad alta' filtra por severidad", () => {
    const { predicate } = INBOX_FILTERS["high-severity"];
    expect(predicate(finding({ severity: "high" }))).toBe(true);
    expect(predicate(finding({ severity: "low" }))).toBe(false);
  });
});
