import { cn } from "@/shared/lib/cn";
import { SEVERITY_CONFIG } from "../lib/findings";
import type { Severity } from "../types";

export function SeverityIndicator({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <span className="inline-flex items-center gap-1.5 text-body-sm">
      <span className={cn("h-[13px] w-[3px] rounded-[2px]", config.barClassName)} />
      {config.label}
    </span>
  );
}
