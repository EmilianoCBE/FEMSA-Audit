import { Search } from "lucide-react";

export function SidebarSearch() {
  return (
    <div className="relative mx-3.5 mt-3.5 mb-1.5">
      <Search size={12} className="absolute top-2 left-[9px]" aria-hidden />
      <input
        type="search"
        aria-label="Buscar"
        placeholder="Buscar auditorías, hallazgos..."
        className="w-full rounded-[5px] border border-line-2 bg-surface py-[7px] pr-2.5 pl-7 text-body-sm text-ink placeholder:text-muted-2"
      />
    </div>
  );
}
