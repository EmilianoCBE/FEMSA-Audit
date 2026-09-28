import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Eyebrow } from "./Eyebrow";

/** Panel lateral derecho de propiedades (se oculta en pantallas pequeñas). */
export function Inspector({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("hidden overflow-y-auto bg-surface desktop:block", className)}>{children}</aside>;
}

export function InspectorHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-line px-4 py-3.5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="mt-[3px] text-heading-sm font-semibold">{title}</h3>
    </div>
  );
}

export function InspectorSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-3.5">
      {title && (
        <Eyebrow size="sm" className="mb-[9px]">
          {title}
        </Eyebrow>
      )}
      {children}
    </section>
  );
}
