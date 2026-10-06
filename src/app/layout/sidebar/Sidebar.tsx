import femsaLogo from "@/assets/femsa-logo.png";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { NavSection } from "../../navigation";
import { NavGroup } from "./NavGroup";
import { SidebarSearch } from "./SidebarSearch";
import { UserCard } from "./UserCard";

function Brand() {
  return (
    <div className="flex items-center gap-[9px] border-b border-line px-[18px] py-4">
      <img src={femsaLogo} alt="FEMSA" className="h-3.5 w-auto" />
      <span className="h-3.5 w-px bg-line-2" />
      <span className="text-body-sm font-medium text-ink-2">Auditoría Interna</span>
    </div>
  );
}

export function Sidebar({ sections }: { sections: readonly NavSection[] }) {
  const user = useCurrentUser();

  const visibleSections = sections
    .map((section) => {
      if (section.label !== "Configuración") {
        return section;
      }

      return {
        ...section,
        items: section.items.filter((item) => {
          if (item.label === "Usuarios y roles") {
            return user.role === "Administrador";
          }

          return true;
        }),
      };
    })
    .filter((section) => section.items.length > 0);

  return (
    <aside className="hidden flex-col border-r border-line bg-nav desktop:flex">
      <Brand />
      <SidebarSearch />

      <nav className="flex-1 overflow-y-auto px-2.5 pt-2 pb-5">
        {visibleSections.map((section) => (
          <NavGroup key={section.label} section={section} />
        ))}
      </nav>

      <UserCard />
    </aside>
  );
}
