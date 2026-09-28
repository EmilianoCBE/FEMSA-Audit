import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/** Título pequeño en mayúsculas para agrupar secciones. */
const eyebrowVariants = cva("font-semibold uppercase", {
  variants: {
    size: {
      xs: "text-caption tracking-[.05em] text-muted-2",
      sm: "text-label tracking-[.04em] text-muted",
    },
  },
  defaultVariants: { size: "xs" },
});

export type EyebrowProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof eyebrowVariants>;

export function Eyebrow({ className, size, ...props }: EyebrowProps) {
  return <div className={cn(eyebrowVariants({ size }), className)} {...props} />;
}
