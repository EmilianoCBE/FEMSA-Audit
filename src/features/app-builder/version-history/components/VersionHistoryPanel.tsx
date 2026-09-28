import { Button, ContentArea, SectionToolbar } from "@/shared/ui";
import type { AppVersion } from "../types";
import { VersionEntry } from "./VersionEntry";

type VersionHistoryPanelProps = {
  versions: readonly AppVersion[];
};

// TODO(US12 - Leonel): conservar configuración por versión en casos abiertos y definir reglas de actualización.
export function VersionHistoryPanel({ versions }: VersionHistoryPanelProps) {
  return (
    <ContentArea>
      <SectionToolbar
        description="Cambios publicados. Los hallazgos ya registrados conservan la estructura con la que fueron creados."
        action={<Button>Comparar versiones</Button>}
      />
      <div className="rounded-md border border-line bg-surface px-4">
        {versions.map((version) => (
          <VersionEntry key={version.id} version={version} />
        ))}
      </div>
    </ContentArea>
  );
}
