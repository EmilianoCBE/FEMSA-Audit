import { Badge } from "@/shared/ui";
import { STATUS_CONFIG } from "../lib/findings";
import type { FindingStatus } from "../types";

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
