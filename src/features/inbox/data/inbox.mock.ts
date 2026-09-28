import type { Finding } from "../types";

export const pendingCountMock = 7;

export const findingsMock: readonly Finding[] = [
  {
    id: "HZ-2041",
    title: "Accesos privilegiados sin revocar en SAP",
    context: "FEMSA Servicios · Auditoría TI Q2",
    status: "in-review",
    severity: "high",
    waitingDays: 2,
  },
  {
    id: "HZ-2038",
    title: "Diferencias en conciliación de inventarios",
    context: "División Bebidas · Auditoría operativa",
    status: "manager-validation",
    severity: "medium",
    waitingDays: 9,
  },
  {
    id: "HZ-2033",
    title: "Segregación de funciones en pagos a proveedores",
    context: "Tesorería corporativa · Auditoría financiera",
    status: "director-validation",
    severity: "high",
    waitingDays: 1,
  },
  {
    id: "HZ-2029",
    title: "Retención de datos personales fuera de política",
    context: "FL Colombia · Auditoría de cumplimiento",
    status: "closed",
    severity: "low",
    waitingDays: null,
  },
];
