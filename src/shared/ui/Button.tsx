import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border border-accent bg-accent text-white hover:bg-accent-hover",
        secondary: "border border-line-2 bg-surface text-ink-2 hover:bg-surface-hover",
        link: "bg-transparent text-accent",
      },
      size: {
        md: "rounded-[5px] px-3 py-1.5 text-body-sm",
        sm: "rounded px-2.5 py-1 text-meta",
      },
    },
    compoundVariants: [
      { variant: "link", size: "md", className: "rounded-none p-0 text-body-sm" },
      { variant: "link", size: "sm", className: "rounded-none px-1 py-0.5 text-control" },
    ],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
