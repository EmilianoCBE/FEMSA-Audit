import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function FilterChip({ selected = false, className, type = "button", ...props }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "rounded-[5px] border px-[11px] py-[5px] text-body-sm",
        selected
          ? "border-accent-line bg-accent-bg font-medium text-accent"
          : "border-line-2 bg-surface text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
