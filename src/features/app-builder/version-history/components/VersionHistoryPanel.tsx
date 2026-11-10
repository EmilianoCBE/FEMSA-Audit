import { usePermissions } from "@/features/auth/permissions";
import { useCallback, useRef, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, EmptyState, QueryState, SectionToolbar } from "@/shared/ui";
import { designerService } from "../../designer/services/designerService";
import type { PlantillaDesigner } from "../../designer/types";
import { diffConfigs, suggestChanges } from "../lib/compareVersions";
import { runningProcessesNotice } from "../../workflow/processes/processes";
import { processService } from "../../workflow/processes/processService";
import { versionsService } from "../services/versionsService";
import type { AppConfig, AppVersion, AppVersionDetail, VersionHistory } from "../types";
import { CompareVersions, DESIGNER_OPTION } from "./CompareVersions";
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

/** Lo que el Designer tiene ahora (campos y flujo del proceso), con la misma forma que el config de una versión. */
async function designerConfig(appId: string): Promise<AppConfig> {
  const plantilla = await designerService.getPlantillaDesigner(appId);
  return { elements: plantilla.elements, workflow: plantilla.workflow ?? null };
}

function Notice({ tone, children, onClose }: { tone: "error" | "success"; children: string; onClose: () => void }) {
  const styles = tone === "error" ? "border-red-line bg-red-bg text-red" : "border-green-line bg-green-bg text-green";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-3 flex items-start gap-2 rounded-md border px-3 py-2 text-body-sm ${styles}`}
    >
      <span className="flex-1">{children}</span>
      <button
        type="button"
        aria-label="Cerrar mensaje"
        className="leading-none opacity-70 hover:opacity-100"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

// US11 - Rafael Valdez: guardar, consultar, comparar, publicar, descartar y restaurar versiones de la aplicación.
function AppVersionHistory({ appId, plantillas, onSelectApp }: AppVersionHistoryProps) {
  // US13: el módulo debe estar en "edit" para el rol; US11: el back confirma si además puede versionar.
  const canEditModule = usePermissions().permissions["app-builder"] === "edit";
  const listVersions = useCallback((signal: AbortSignal) => versionsService.list(appId, signal), [appId]);
  const query = useQuery(listVersions);
  // Workflow fase 4: procesos en curso por versión, para avisar al publicar que siguen con la suya.
  const running = useQuery(useCallback((signal: AbortSignal) => processService.summary(appId, signal), [appId]));
  // Las versiones no cambian una vez guardadas: su detalle se pide una sola vez.
  const detailsCache = useRef(new Map<string, AppVersionDetail>());
  const [openDetails, setOpenDetails] = useState<Record<string, AppVersionDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string>();
  const [saveForm, setSaveForm] = useState<{ initialText: string }>();
  const [isComparing, setIsComparing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const loadDetail = useCallback(
    async (versionId: string) => {
      const cached = detailsCache.current.get(versionId);
      if (cached) return cached;
      const detail = await versionsService.get(appId, versionId);
      detailsCache.current.set(versionId, detail);
      return detail;
    },
    [appId],
  );

  const loadConfig = useCallback(
    async (id: string): Promise<AppConfig> =>
      id === DESIGNER_OPTION ? await designerConfig(appId) : (await loadDetail(id)).config,
    [appId, loadDetail],
  );

  /** Marca ocupado, limpia mensajes, ejecuta y recarga el historial (también si falló: pudo cambiar a medias). */
  async function run(action: () => Promise<string | undefined>, fallbackError: string) {
    setIsBusy(true);
    setMessage(undefined);
    setError(undefined);
    try {
      setMessage(await action());
    } catch (reason) {
      setError(errorMessage(reason, fallbackError));
    } finally {
      setIsBusy(false);
      query.reload();
    }
  }

  /** Abre el formulario con los cambios sugeridos (Designer vs. la versión más reciente). */
  const openSaveForm = (history: VersionHistory) =>
    run(async () => {
      const [latest] = history.versions;
      const plantilla = await designerService.getPlantillaDesigner(appId);
      const suggestions = latest
        ? suggestChanges(
            diffConfigs(await loadConfig(latest.id), {
              elements: plantilla.elements,
              workflow: plantilla.workflow ?? null,
            }),
          )
        : ["Versión inicial"];
      setSaveForm({ initialText: suggestions.join("\n") });
      return undefined;
    }, "No se pudo preparar la versión.");

  const saveVersion = (changes: string[]) =>
    run(async () => {
      const plantilla = await designerService.getPlantillaDesigner(appId);
      const saved = await versionsService.save(appId, { elements: plantilla.elements }, changes);
      setSaveForm(undefined);
      return `Se guardó ${saved.version} como borrador.`;
    }, "No se pudo guardar la versión.");

  const publishVersion = (version: AppVersion) =>
    run(async () => {
      await versionsService.publish(appId, version.id);
      return `${version.version} es ahora la versión vigente.`;
    }, "No se pudo publicar la versión.");

  const discardVersion = (version: AppVersion) =>
    run(async () => {
      await versionsService.discard(appId, version.id);
      return `Se descartó ${version.version}.`;
    }, "No se pudo descartar la versión.");

  const restoreVersion = (version: AppVersion, { publish }: { publish: boolean }) =>
    run(async () => {
      const { version: restored, backup } = await versionsService.restore(appId, version.id);
      const backupNote = backup ? ` El estado anterior del Designer se guardó como ${backup.version}.` : "";
      if (!publish) {
        return `Se restauró la configuración de ${version.version} como ${restored.version} (borrador).${backupNote}`;
      }
      await versionsService.publish(appId, restored.id);
      return `Se restauró la configuración de ${version.version} como ${restored.version} y ahora es la versión vigente.${backupNote}`;
    }, "No se pudo restaurar la versión.");

  async function toggleDetail(version: AppVersion) {
    if (openDetails[version.id]) {
      setOpenDetails(({ [version.id]: _hidden, ...rest }) => rest);
      return;
    }
    setError(undefined);
    setLoadingDetailId(version.id);
    try {
      const detail = await loadDetail(version.id);
      setOpenDetails((current) => ({ ...current, [version.id]: detail }));
    } catch (reason) {
      setError(errorMessage(reason, "No se pudo cargar la versión."));
    } finally {
      setLoadingDetailId(undefined);
    }
  }

  const history = query.data;
  const versions = history?.versions ?? [];
  const canEdit = canEditModule && (history?.canEdit ?? false);
  const hasUnversionedChanges = history?.designer.hasUnversionedChanges ?? false;
  const nothingToSave = versions.length > 0 && !hasUnversionedChanges;
  const canCompare = versions.length >= 2 || (versions.length === 1 && hasUnversionedChanges);
  const currentVersion = versions.find((version) => version.status === "current")?.version;

  return (
    <>
      <SectionToolbar
        description="Cada versión guarda la configuración completa del formulario. Publica un borrador para que sea la versión vigente; restaurar crea un borrador nuevo y nunca borra el historial."
        action={
          <div className="flex gap-2">
            <Button disabled={!canCompare || isComparing} onClick={() => setIsComparing(true)}>
              Comparar versiones
            </Button>
            {canEdit && history && (
              <Button
                variant="primary"
                disabled={isBusy || Boolean(saveForm) || nothingToSave}
                title={nothingToSave ? `No hay cambios desde ${versions[0].version}.` : undefined}
                onClick={() => openSaveForm(history)}
              >
                Guardar versión
              </Button>
            )}
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
          disabled={isBusy}
          onChange={(event) => onSelectApp(event.target.value)}
        >
          {plantillas.map((plantilla) => (
            <option key={plantilla.id} value={plantilla.id}>
              {plantilla.name}
            </option>
          ))}
        </select>
      </div>

      {history && !canEdit && (
        <p className="mb-3 text-body-sm text-muted">
          Solo lectura: tu rol puede consultar y comparar el historial, pero no guardar, publicar ni restaurar
          versiones.
        </p>
      )}
      {canEdit && hasUnversionedChanges && versions.length > 0 && !saveForm && (
        <div className="mb-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-body-sm text-amber">
          El Designer tiene cambios que no están guardados en ninguna versión.
        </div>
      )}

      {saveForm && (
        <SaveVersionForm
          initialText={saveForm.initialText}
          disabled={isBusy}
          onCancel={() => setSaveForm(undefined)}
          onSave={saveVersion}
        />
      )}
      {isComparing && canCompare && (
        <CompareVersions
          versions={versions}
          hasUnversionedChanges={hasUnversionedChanges}
          loadConfig={loadConfig}
          onClose={() => setIsComparing(false)}
        />
      )}

      {error && (
        <Notice tone="error" onClose={() => setError(undefined)}>
          {error}
        </Notice>
      )}
      {message && (
        <Notice tone="success" onClose={() => setMessage(undefined)}>
          {message}
        </Notice>
      )}

      <QueryState query={query}>
        {({ versions: list, designer }) =>
          list.length === 0 ? (
            <EmptyState
              title="Aún no hay versiones"
              description="Guarda la configuración actual para empezar el historial de cambios."
            />
          ) : (
            <div className="rounded-md border border-line bg-surface px-4">
              {list.map((version) => (
                <VersionEntry
                  key={version.id}
                  version={version}
                  detail={openDetails[version.id]}
                  isLoadingDetail={loadingDetailId === version.id}
                  inDesigner={designer.versionId === version.id}
                  currentVersion={currentVersion}
                  hasUnversionedChanges={designer.hasUnversionedChanges}
                  canEdit={canEdit}
                  disabled={isBusy}
                  onView={toggleDetail}
                  onPublish={publishVersion}
                  onDiscard={discardVersion}
                  onRestore={restoreVersion}
                  publishNotice={(version) => runningProcessesNotice(running.data ?? [], version.version)}
                />
              ))}
            </div>
          )
        }
      </QueryState>
    </>
  );
}
