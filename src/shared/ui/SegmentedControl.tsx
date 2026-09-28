import { cn } from "@/shared/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({ options, value, onValueChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" className={cn("flex gap-0.5", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex-1 border px-2 py-1.5 text-control first:rounded-l-[5px] last:rounded-r-[5px] last:border-l-0",
              selected ? "border-accent-line bg-accent-bg font-medium text-accent" : "border-line-2 bg-surface text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
