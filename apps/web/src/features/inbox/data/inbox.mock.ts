import type { Finding } from "../types";

export const findingsMock: Finding[] = [
  {
    id: "HZ-2041",
    title: "Accesos privilegiados sin revocar en SAP",
    businessUnit: "FEMSA Servicios",
    auditName: "Auditoría TI Q2",
    status: "in-review",
    severity: "high",
    waitingDays: 2,
  },
  {
    id: "HZ-2038",
    title: "Diferencias en conciliación de inventarios",
    businessUnit: "División Bebidas",
    auditName: "Auditoría operativa",
    status: "manager-validation",
    severity: "medium",
    waitingDays: 9,
  },
  {
    id: "HZ-2033",
    title: "Segregación de funciones en pagos a proveedores",
    businessUnit: "Tesorería corporativa",
    auditName: "Auditoría financiera",
    status: "director-validation",
    severity: "high",
    waitingDays: 1,
  },
  {
    id: "HZ-2029",
    title: "Retención de datos personales fuera de política",
    businessUnit: "FL Colombia",
    auditName: "Auditoría de cumplimiento",
    status: "closed",
    severity: "low",
    waitingDays: null,
  },
];
