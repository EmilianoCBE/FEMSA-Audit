import { cn } from "@/shared/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, label, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "flex size-3.5 flex-none items-center justify-center rounded-[3px] border",
        checked ? "border-accent bg-accent" : "border-line-2",
        className,
      )}
    >
      {checked && (
        <span className="h-[7px] w-1 border-r-[1.5px] border-b-[1.5px] border-white [transform:rotate(45deg)_translate(-1px,-1px)]" />
      )}
    </button>
  );
}
