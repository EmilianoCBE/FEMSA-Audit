import { Eyebrow, Tag } from "@/shared/ui";
import type { NavSection } from "../../navigation";
import { NavItemLink } from "./NavItemLink";

export function NavGroup({ section }: { section: NavSection }) {
  return (
    <div className="mt-3.5">
      <Eyebrow className="mb-[5px] flex items-center justify-between px-2">
        {section.label}
        {section.owner && <Tag size="xs" className="tracking-normal normal-case">{section.owner}</Tag>}
      </Eyebrow>
      {section.items.map((item) => (
        <div key={item.label}>
          <NavItemLink item={item} />
          {item.children && (
            <div className="pl-[22px]">
              {item.children.map((child) => (
                <NavItemLink key={child.label} item={child} nested />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
