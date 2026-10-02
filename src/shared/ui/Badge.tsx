import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva("inline-flex items-center gap-[5px] rounded border py-0.5 font-medium whitespace-nowrap", {
  variants: {
    tone: {
      blue: "border-accent-line bg-accent-bg text-accent",
      amber: "border-amber-line bg-amber-bg text-amber",
      green: "border-green-line bg-green-bg text-green",
      red: "border-red-line bg-red-bg text-red",
      gray: "border-line-2 bg-bg text-muted",
    },
    size: {
      md: "px-2 text-meta",
      sm: "px-[7px] text-label",
    },
  },
  defaultVariants: { tone: "gray", size: "md" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
