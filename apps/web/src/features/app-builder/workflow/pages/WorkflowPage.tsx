import { Outlet } from "react-router";
import { Page, PageHeader, RouteTabs } from "@/shared/ui";
import { WORKFLOW_TABS } from "../tabs";

export function WorkflowPage() {
  return (
    <Page>
      <PageHeader
        title="Ciclo de vida del hallazgo"
        description="Define los estados por los que pasa un hallazgo, quién puede moverlo entre ellos y qué reglas se aplican en cada paso."
      >
        <RouteTabs label="Secciones del workflow" tabs={WORKFLOW_TABS} />
      </PageHeader>
      <Outlet />
    </Page>
  );
}
