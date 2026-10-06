import { useMemo, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { ContentArea, EmptyState, Page, PageHeader, QueryState, Tabs, type StateTab } from "@/shared/ui";
import { FindingsTable } from "../components/FindingsTable";
import { InboxFilters } from "../components/InboxFilters";
import { INBOX_FILTERS } from "../lib/findings";
import { findingsService } from "../services/findingsService";
import type { Finding, InboxFilter, InboxTab } from "../types";

function PendingFindings({ findings }: { findings: readonly Finding[] }) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const visibleFindings = useMemo(() => findings.filter(INBOX_FILTERS[filter].predicate), [findings, filter]);

  return (
    <>
      <InboxFilters
        value={filter}
        onValueChange={setFilter}
        visibleCount={visibleFindings.length}
        totalCount={findings.length}
      />
      <FindingsTable findings={visibleFindings} />
    </>
  );
}

export function InboxPage() {
  const [tab, setTab] = useState<InboxTab>("pending");
  const query = useQuery(findingsService.list);

  const tabs: readonly StateTab<InboxTab>[] = [
    { id: "pending", label: "Pendientes", count: query.data?.length },
    { id: "delegated", label: "Delegados" },
    { id: "completed", label: "Completados" },
  ];

  return (
    <Page>
      <PageHeader
        title="Mi bandeja"
        description="Hallazgos y aprobaciones que esperan tu acción, ordenados por antigüedad."
      >
        <Tabs label="Bandeja" tabs={tabs} value={tab} onValueChange={setTab} />
      </PageHeader>

      <ContentArea>
        {tab === "pending" ? (
          <QueryState query={query}>{(findings) => <PendingFindings findings={findings} />}</QueryState>
        ) : (
          <EmptyState
            title="Sin elementos por ahora"
            description="Esta vista se conectará cuando exista el servicio de bandeja."
          />
        )}
      </ContentArea>
    </Page>
  );
}
