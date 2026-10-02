import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** Contenedor de una pantalla completa dentro del layout principal. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("flex min-h-0 flex-1 flex-col", className)}>{children}</section>;
}

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Normalmente la navegación de tabs de la pantalla. */
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="px-4 pt-5 desktop:px-6">
      <h1 className="m-0 text-heading font-semibold tracking-[-0.01em]">{title}</h1>
      {description && <p className="mt-1 max-w-[640px] text-body text-muted">{description}</p>}
      {children}
    </header>
  );
}

/** Área desplazable con el padding estándar de contenido. */
export function ContentArea({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto px-4 py-5 desktop:px-6", className)}>{children}</div>;
}

/** Descripción corta de la sección con una acción opcional alineada a la derecha. */
export function SectionToolbar({ description, action }: { description: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-start gap-3.5">
      <div className="max-w-[600px] text-body-sm text-muted">{description}</div>
      {action && <div className="ml-auto flex-none">{action}</div>}
    </div>
  );
}
