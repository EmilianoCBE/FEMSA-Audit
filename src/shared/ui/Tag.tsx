import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/** Etiqueta neutra con contorno (propietario de módulo, nivel de confianza, etc.). */
const tagVariants = cva("inline-block flex-none rounded-[3px] border border-line-2 px-1 whitespace-nowrap", {
  variants: {
    size: {
      xs: "text-micro font-medium text-muted-2",
      sm: "text-caption text-muted",
    },
  },
  defaultVariants: { size: "sm" },
});

export type TagProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>;

export function Tag({ className, size, ...props }: TagProps) {
  return <span className={cn(tagVariants({ size }), className)} {...props} />;
}
