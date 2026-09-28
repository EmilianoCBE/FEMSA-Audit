import { Badge, type BadgeTone } from "@/shared/ui";
import type { VersionStatus } from "../types";

const STATUS_CONFIG: Record<VersionStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Borrador", tone: "amber" },
  current: { label: "Vigente", tone: "green" },
  archived: { label: "Archivada", tone: "gray" },
};

export function VersionStatusBadge({ status }: { status: VersionStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
