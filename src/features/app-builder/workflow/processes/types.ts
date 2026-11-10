import type { StoredWorkflow, TransitionRequirements } from "../types";

// Fase 4 del workflow: procesos (hallazgos) que recorren el flujo con la versión con la que empezaron.

export type ProcessStatus = "active" | "completed";

export type ProcessSummary = {
  id: string;
  appId: string;
  title: string;
  status: ProcessStatus;
  /** Versión anclada: el proceso termina con su flujo aunque se publique otra. */
  version: { id: number; number: number; isCurrent: boolean };
  currentState: { id: string; name: string; kind: string | null };
  daysInState: number;
  slaDays: number | null;
  overdue: boolean;
  startedBy: string;
  startedAt: string;
  completedAt: string | null;
};

export type ProcessAction = {
  transitionId: string;
  label: string;
  toStateId: string;
  toStateName: string;
  role: string | null;
  requires: TransitionRequirements;
  allowed: boolean;
  /** Por qué no se puede (rol, segregación de funciones). */
  reason: string | null;
};

export type ActionPlan = { description: string; owner: string; dueDate: string };

export type ProcessHistoryEntry = {
  id: number;
  transitionId: string | null;
  action: string;
  fromStateId: string | null;
  fromStateName: string | null;
  toStateId: string;
  toStateName: string;
  actorName: string;
  actorRole: string | null;
  comment: string | null;
  evidence: string | null;
  actionPlan: ActionPlan | null;
  at: string;
};

export type ProcessDetail = ProcessSummary & {
  workflow: StoredWorkflow | null;
  myRoles: string[];
  actions: ProcessAction[];
  history: ProcessHistoryEntry[];
};

export type TransitionInput = {
  transitionId: string;
  comment?: string;
  evidence?: string;
  actionPlan?: ActionPlan;
};
