import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const trackVariants = cva("relative inline-block flex-none rounded-full transition-colors", {
  variants: {
    size: { md: "h-[17px] w-[30px]", sm: "h-[15px] w-[26px]" },
    checked: { true: "bg-accent", false: "bg-line-2" },
  },
  defaultVariants: { size: "md", checked: false },
});

const thumbVariants = cva("absolute top-0.5 rounded-full bg-white shadow-[0_1px_1px_rgba(0,0,0,.15)] transition-[left]", {
  variants: {
    size: { md: "size-[13px]", sm: "size-[11px]" },
    checked: { true: "", false: "left-0.5" },
  },
  compoundVariants: [
    { size: "md", checked: true, className: "left-[15px]" },
    { size: "sm", checked: true, className: "left-[13px]" },
  ],
  defaultVariants: { size: "md", checked: false },
});

type SwitchProps = VariantProps<typeof trackVariants> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
};

export function Switch({ checked, onCheckedChange, label, size, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(trackVariants({ size, checked }), className)}
    >
      <span className={thumbVariants({ size, checked })} />
    </button>
  );
}
