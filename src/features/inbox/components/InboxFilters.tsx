import { FilterChip } from "@/shared/ui";
import { INBOX_FILTERS } from "../lib/findings";
import type { InboxFilter } from "../types";

const FILTER_IDS = Object.keys(INBOX_FILTERS) as InboxFilter[];

type InboxFiltersProps = {
  value: InboxFilter;
  onValueChange: (filter: InboxFilter) => void;
  visibleCount: number;
  totalCount: number;
};

export function InboxFilters({ value, onValueChange, visibleCount, totalCount }: InboxFiltersProps) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2">
      {FILTER_IDS.map((filter) => (
        <FilterChip key={filter} selected={filter === value} onClick={() => onValueChange(filter)}>
          {INBOX_FILTERS[filter].label}
        </FilterChip>
      ))}
      <span className="ml-auto text-body-sm text-muted">
        Mostrando {visibleCount} de {totalCount}
      </span>
    </div>
  );
}
