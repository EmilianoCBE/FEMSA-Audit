import { useMemo, useState } from "react";
import { ContentArea, EmptyState, Page, PageHeader, Tabs, type StateTab } from "@/shared/ui";
import { FindingsTable } from "../components/FindingsTable";
import { InboxFilters } from "../components/InboxFilters";
import { findingsMock, pendingCountMock } from "../data/inbox.mock";
import { INBOX_FILTERS } from "../lib/findings";
import type { InboxFilter, InboxTab } from "../types";

const INBOX_TABS: readonly StateTab<InboxTab>[] = [
  { id: "pending", label: "Pendientes", count: pendingCountMock },
  { id: "delegated", label: "Delegados" },
  { id: "completed", label: "Completados" },
];

export function InboxPage() {
  const [tab, setTab] = useState<InboxTab>("pending");
  const [filter, setFilter] = useState<InboxFilter>("all");

  const visibleFindings = useMemo(() => findingsMock.filter(INBOX_FILTERS[filter].predicate), [filter]);

  return (
    <Page>
      <PageHeader title="Mi bandeja" description="Hallazgos y aprobaciones que esperan tu acción, ordenados por antigüedad.">
        <Tabs label="Bandeja" tabs={INBOX_TABS} value={tab} onValueChange={setTab} />
      </PageHeader>

      <ContentArea>
        {tab === "pending" ? (
          <>
            <InboxFilters
              value={filter}
              onValueChange={setFilter}
              visibleCount={visibleFindings.length}
              totalCount={pendingCountMock}
            />
            <FindingsTable findings={visibleFindings} />
          </>
        ) : (
          <EmptyState title="Sin elementos por ahora" description="Esta vista se conectará cuando exista el servicio de bandeja." />
        )}
      </ContentArea>
    </Page>
  );
}
