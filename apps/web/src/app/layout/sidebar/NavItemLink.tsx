import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { cn } from "@/shared/lib/cn";
import type { NavItem } from "../../navigation";

const itemClassName = (active: boolean, nested: boolean) =>
  cn(
    "mb-px flex w-full items-center gap-2 rounded-[5px] px-2 text-left text-ink-2",
    nested ? "py-[5px] text-body-sm/[normal]" : "py-1.5 text-body/[normal]",
    active ? "bg-accent-bg font-medium text-accent" : "hover:bg-nav-hover",
  );

function ItemContent({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <>
      {Icon && (
        <span className={cn("flex size-3 flex-none items-center justify-center", active ? "opacity-100" : "opacity-65")}>
          <Icon className="size-3" />
        </span>
      )}
      {item.label}
      {item.count !== undefined && (
        <span
          className={cn(
            "ml-auto rounded-[9px] px-1.5 text-label font-medium",
            active ? "bg-accent-soft text-accent" : "bg-count text-muted",
          )}
        >
          {item.count}
        </span>
      )}
    </>
  );
}

/** Renderiza un ítem de navegación: enlace si tiene ruta, botón inactivo si aún no existe el módulo. */
export function NavItemLink({ item, nested = false }: { item: NavItem; nested?: boolean }): ReactNode {
  if (!item.to) {
    return (
      <button type="button" className={itemClassName(false, nested)} title="Próximamente">
        <ItemContent item={item} active={false} />
      </button>
    );
  }

  return (
    <NavLink to={item.to} className={({ isActive }) => itemClassName(isActive, nested)}>
      {({ isActive }) => <ItemContent item={item} active={isActive} />}
    </NavLink>
  );
}
