import { cn } from "@/shared/lib/cn";
import { nextPermissionLevel } from "../lib/permissions";
import type { PermissionLevel } from "../types";

const LEVEL_CONFIG: Record<PermissionLevel, { label: string; className: string }> = {
  edit: { label: "Edición", className: "border-accent-line bg-accent-bg text-accent" },
  read: { label: "Lectura", className: "border-line-2 bg-nav text-ink-2" },
  hidden: { label: "Oculto", className: "border-line bg-transparent text-muted-2" },
};

type PermissionToggleProps = {
  level: PermissionLevel;
  onChange: (level: PermissionLevel) => void;
  /** Descripción accesible, ej. "Título del hallazgo · Auditor". */
  label: string;
};

export function PermissionToggle({ level, onChange, label }: PermissionToggleProps) {
  const config = LEVEL_CONFIG[level];
  return (
    <button
      type="button"
      aria-label={`${label}: ${config.label}`}
      onClick={() => onChange(nextPermissionLevel(level))}
      className={cn("inline-block min-w-16 rounded border px-2 py-0.5 text-label font-medium", config.className)}
    >
      {config.label}
    </button>
  );
}
