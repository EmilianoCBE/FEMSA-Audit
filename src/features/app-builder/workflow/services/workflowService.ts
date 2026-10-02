import { notificationRulesMock, workflowRulesMock } from "../data/workflow.mock";
import type { NotificationRule, WorkflowRule } from "../types";

// Mock por ahora; con tablas: `listRules: (signal) => httpClient.get<WorkflowRule[]>("/workflow/rules", signal)`.
// TODO(US04 - Rafael Valdez): cargar también estados y transiciones del diagrama.
export const workflowService = {
  listRules: async (_signal?: AbortSignal): Promise<WorkflowRule[]> => workflowRulesMock,
  listNotificationRules: async (_signal?: AbortSignal): Promise<NotificationRule[]> => notificationRulesMock,
};
