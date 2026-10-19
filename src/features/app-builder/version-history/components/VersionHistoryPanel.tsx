import { useCallback, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, EmptyState, QueryState, SectionToolbar } from "@/shared/ui";
import { designerService } from "../../designer/services/designerService";
import type { PlantillaDesigner } from "../../designer/types";
import { versionsService } from "../services/versionsService";
import type { AppVersion, AppVersionDetail } from "../types";
import { SaveVersionForm } from "./SaveVersionForm";
import { VersionEntry } from "./VersionEntry";

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

// TODO(US12 - Leonel): conservar configuración por versión en casos abiertos y definir reglas de actualización.
export function VersionHistoryPanel() {
  const plantillasQuery = useQuery(designerService.listPlantillasDesigner);
  const [selectedAppId, setSelectedAppId] = useState<string>();

  return (
    <ContentArea>
      <QueryState query={plantillasQuery}>
        {(plantillas) => {
          const appId = selectedAppId ?? plantillas[0]?.id;
          if (!appId) {
            return (
              <EmptyState
                title="No hay aplicaciones"
                description="Crea una plantilla en la pestaña Campos para empezar su historial."
              />
            );
          }
          return <AppVersionHistory key={appId} appId={appId} plantillas={plantillas} onSelectApp={setSelectedAppId} />;
        }}
      </QueryState>
    </ContentArea>
  );
}

type AppVersionHistoryProps = {
  appId: string;
  plantillas: PlantillaDesigner[];
  onSelectApp: (appId: string) => void;
};

// US11 - Rafael Valdez: guardar, consultar, publicar y restaurar versiones de la aplicación seleccionada.
function AppVersionHistory({ appId, plantillas, onSelectApp }: AppVersionHistoryProps) {
  const listVersions = useCallback((signal: AbortSignal) => versionsService.list(appId, signal), [appId]);
  const query = useQuery(listVersions);
  const [details, setDetails] = useState<Record<string, AppVersionDetail>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<string>, fallbackError: string) {
    setIsBusy(true);
    setMessage(undefined);
    setError(undefined);
    try {
      setMessage(await action());
      query.reload();
    } catch (reason) {
      setError(errorMessage(reason, fallbackError));
    } finally {
      setIsBusy(false);
    }
  }

  const saveVersion = (changes: string[]) =>
    run(async () => {
      const plantilla = await designerService.getPlantillaDesigner(appId);
      const saved = await versionsService.save(appId, { elements: plantilla.elements }, changes);
      setIsSaving(false);
      return `Se guardó ${saved.version} como borrador.`;
    }, "No se pudo guardar la versión.");

  const publishVersion = (version: AppVersion) =>
    run(async () => {
      await versionsService.publish(appId, version.id);
      return `${version.version} es ahora la versión vigente.`;
    }, "No se pudo publicar la versión.");

  const restoreVersion = (version: AppVersion) =>
    run(async () => {
      const restored = await versionsService.restore(appId, version.id);
      if (restored.config.elements) await designerService.saveCanvasDesigner(appId, restored.config.elements);
      return `Se restauró la configuración de ${version.version} como ${restored.version} (borrador).`;
    }, "No se pudo restaurar la versión.");

  async function toggleDetail(version: AppVersion) {
    if (details[version.id]) {
      setDetails(({ [version.id]: _hidden, ...rest }) => rest);
      return;
    }
    setError(undefined);
    try {
      const detail = await versionsService.get(appId, version.id);
      setDetails((current) => ({ ...current, [version.id]: detail }));
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo cargar la versión."));
    }
  }

  return (
    <>
      <SectionToolbar
        description="Cada versión guarda la configuración completa del formulario. Los hallazgos ya registrados conservan la estructura con la que fueron creados."
        action={
          <div className="flex gap-2">
            <Button>Comparar versiones</Button>
            <Button variant="primary" disabled={isSaving} onClick={() => setIsSaving(true)}>
              Guardar versión
            </Button>
          </div>
        }
      />

      <div className="mb-3.5 max-w-[320px]">
        <label htmlFor="version-history-app" className="mb-1 block text-label font-medium uppercase text-muted">
          Aplicación
        </label>
        <select
          id="version-history-app"
          className="w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
          value={appId}
          onChange={(event) => onSelectApp(event.target.value)}
        >
          {plantillas.map((plantilla) => (
            <option key={plantilla.id} value={plantilla.id}>
              {plantilla.name}
            </option>
          ))}
        </select>
      </div>

      {isSaving && <SaveVersionForm disabled={isBusy} onCancel={() => setIsSaving(false)} onSave={saveVersion} />}

      {error && (
        <div role="alert" className="mb-3 rounded-md border border-red-line bg-red-bg px-3 py-2 text-body-sm text-red">
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mb-3 rounded-md border border-green-line bg-green-bg px-3 py-2 text-body-sm text-green"
        >
          {message}
        </div>
      )}

      <QueryState query={query}>
        {(versions) =>
          versions.length === 0 ? (
            <EmptyState
              title="Aún no hay versiones"
              description="Guarda la configuración actual para empezar el historial de cambios."
            />
          ) : (
            <div className="rounded-md border border-line bg-surface px-4">
              {versions.map((version) => (
                <VersionEntry
                  key={version.id}
                  version={version}
                  detail={details[version.id]}
                  disabled={isBusy}
                  onView={toggleDetail}
                  onPublish={publishVersion}
                  onRestore={restoreVersion}
                />
              ))}
            </div>
          )
        }
      </QueryState>
    </>
  );
}
