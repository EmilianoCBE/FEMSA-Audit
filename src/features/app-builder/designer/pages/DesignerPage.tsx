import { Outlet } from "react-router";
import { Page, PageHeader, RouteTabs } from "@/shared/ui";
import { EmbeddedWorkflowPanel } from "../../workflow/components/EmbeddedWorkflowPanel";
import { DESIGNER_TABS } from "../tabs";

export function DesignerPage() {
  return (
    <Page>
      <PageHeader
        title="Designer del formulario"
        description="Configura los campos que capturan los auditores, sus permisos por rol y las validaciones del formulario."
      >
        <RouteTabs label="Secciones del designer" tabs={DESIGNER_TABS} />
      </PageHeader>
      <EmbeddedWorkflowPanel />
      {/* Espacio para que lo último de la página pueda quedar arriba de la miniatura del flujo (esquina inferior) */}
      <div className="pb-40">
        <Outlet />
      </div>
    </Page>
  );
}
