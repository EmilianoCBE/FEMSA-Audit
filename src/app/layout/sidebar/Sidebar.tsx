import type { NavSection } from "../../navigation";
import { NavGroup } from "./NavGroup";
import { SidebarSearch } from "./SidebarSearch";
import { UserCard } from "./UserCard";

function Brand() {
  return (
    <div className="flex items-center gap-[9px] border-b border-line px-[18px] py-4">
      <span className="text-body font-semibold tracking-[-0.01em] text-femsa">FEMSA</span>
      <span className="h-3.5 w-px bg-line-2" />
      <span className="text-body-sm font-medium text-ink-2">Auditoría Interna</span>
    </div>
  );
}

export function Sidebar({ sections }: { sections: readonly NavSection[] }) {
  return (
    <aside className="hidden flex-col border-r border-line bg-nav desktop:flex">
      <Brand />
      <SidebarSearch />
      <nav className="flex-1 overflow-y-auto px-2.5 pt-2 pb-5">
        {sections.map((section) => (
          <NavGroup key={section.label} section={section} />
        ))}
      </nav>
      <UserCard />
    </aside>
  );
}
