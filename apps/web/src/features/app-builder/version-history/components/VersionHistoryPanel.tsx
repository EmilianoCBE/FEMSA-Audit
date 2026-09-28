import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, QueryState, SectionToolbar } from "@/shared/ui";
import { versionsService } from "../services/versionsService";
import { VersionEntry } from "./VersionEntry";

// TODO(US12 - Leonel): conservar configuración por versión en casos abiertos y definir reglas de actualización.
export function VersionHistoryPanel() {
  const query = useQuery(versionsService.list);

  return (
    <ContentArea>
      <SectionToolbar
        description="Cambios publicados. Los hallazgos ya registrados conservan la estructura con la que fueron creados."
        action={<Button>Comparar versiones</Button>}
      />
      <QueryState query={query}>
        {(versions) => (
          <div className="rounded-md border border-line bg-surface px-4">
            {versions.map((version) => (
              <VersionEntry key={version.id} version={version} />
            ))}
          </div>
        )}
      </QueryState>
    </ContentArea>
  );
}
