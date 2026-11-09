import { describe, expect, it } from "vitest";
import type { DesignerMetrics } from "../types";
import { formatLatency, summarizeMetrics } from "./metricsSummary";

const metrics: DesignerMetrics = {
  appId: "layout dummy",
  bySource: {
    rules: { total: 5, pending: 1, accepted: 2, replaced: 1, rejected: 1 },
    ai: { total: 2, pending: 2, accepted: 0, replaced: 0, rejected: 0 },
  },
  acceptanceRate: { rules: 0.75, ai: null },
  avgAiLatencyMs: 2340,
};

describe("US17 métricas del asistente", () => {
  it("resume la aceptación por origen", () => {
    const [rules, ai] = summarizeMetrics(metrics);
    expect(rules).toMatchObject({ label: "Reglas", decided: 4, acceptance: "75 %" });
    expect(rules.detail).toBe("2 aceptadas · 1 reemplazadas · 1 rechazadas · 1 pendientes");
    expect(ai).toMatchObject({ label: "IA", decided: 0, acceptance: "—" });
  });

  it("muestra la latencia contra la meta de 10 s", () => {
    expect(formatLatency(2340)).toBe("2.3 s (meta < 10 s)");
    expect(formatLatency(12000)).toBe("12.0 s (arriba de la meta de 10 s)");
    expect(formatLatency(null)).toBeNull();
  });
});
