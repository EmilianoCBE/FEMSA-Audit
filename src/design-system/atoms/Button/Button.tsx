import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "primary" | "link";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({ children, className = "", variant = "default", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "primary" : variant === "link" ? "lbtn" : "btn";
  const mergedClassName = variant === "link" ? `${variantClass} ${className}` : `${variantClass} ${className}`;

  return (
    <button className={mergedClassName.trim()} {...props}>
      {children}
    </button>
  );
}
