import { type ReactNode, useState } from "react";
import { Badge, Button } from "@/shared/ui";
import { formatDateTime, formatPublishedAt } from "../lib/formatPublishedAt";
import { describeFields } from "../lib/versionChanges";
import type { AppVersion, AppVersionDetail } from "../types";
import { VersionStatusBadge } from "./VersionStatusBadge";

type PendingAction = "publish" | "discard" | "restore";

type VersionEntryProps = {
  version: AppVersion;
  /** Detalle cargado al pulsar "Ver"; si existe, se muestra la configuración guardada. */
  detail?: AppVersionDetail;
  isLoadingDetail?: boolean;
  /** Esta versión es la que está ahora en el lienzo del Designer. */
  inDesigner?: boolean;
  /** Versión vigente actual (ej. "v2"), para explicar qué pasará al publicar. */
  currentVersion?: string;
  /** El Designer tiene cambios sin versión: al restaurar se respaldan primero. */
  hasUnversionedChanges?: boolean;
  /** Si es false, la versión solo se puede consultar. */
  canEdit?: boolean;
  disabled?: boolean;
  onView?: (version: AppVersion) => void;
  onPublish?: (version: AppVersion) => void;
  onDiscard?: (version: AppVersion) => void;
  onRestore?: (version: AppVersion, options: { publish: boolean }) => void;
  /** Workflow fase 4: aviso de procesos en curso que seguirán con su versión al publicar esta. */
  publishNotice?: (version: AppVersion) => string | null;
};

function ConfirmBox({ label, children, actions }: { label: string; children: ReactNode; actions: ReactNode }) {
  return (
    <fieldset
      aria-label={label}
      className="my-2 flex flex-wrap items-center gap-2 rounded-md border border-line bg-bg px-3 py-2 text-body-sm text-ink-2"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <div className="ml-auto flex flex-wrap gap-1.5">{actions}</div>
    </fieldset>
  );
}

export function VersionEntry({
  version,
  detail,
  isLoadingDetail,
  inDesigner,
  currentVersion,
  hasUnversionedChanges,
  canEdit = true,
  disabled,
  onView,
  onPublish,
  onDiscard,
  onRestore,
  publishNotice,
}: VersionEntryProps) {
  const [pending, setPending] = useState<PendingAction>();
  const fields = detail ? describeFields(detail.config) : [];
  const isDraft = version.status === "draft";
  const cancel = (
    <Button size="sm" onClick={() => setPending(undefined)}>
      Cancelar
    </Button>
  );
  const confirm = (action: () => void) => () => {
    setPending(undefined);
    action();
  };

  return (
    <article
      className="flex gap-3.5 border-b border-line py-3.5 last:border-b-0"
      aria-label={`Versión ${version.version}`}
    >
      <div className="w-[70px] flex-none text-right">
        <div className="text-body font-semibold">{version.version}</div>
        <div className="mt-0.5 text-meta text-muted">
          {formatPublishedAt(version.publishedAt ?? version.createdAt ?? null)}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[5px] flex flex-wrap items-center gap-2">
          <VersionStatusBadge status={version.status} />
          {inDesigner && <Badge tone="blue">En el Designer</Badge>}
          <span className="text-body-sm text-ink-2">{version.author}</span>
          {version.restoredFrom && <span className="text-meta text-muted">Restaurada de {version.restoredFrom}</span>}
          <div className="ml-auto flex flex-none gap-1.5">
            <Button variant="link" size="sm" disabled={isLoadingDetail} onClick={() => onView?.(version)}>
              {isLoadingDetail ? "Cargando…" : detail ? "Ocultar" : "Ver"}
            </Button>
            {canEdit && !pending && (
              <>
                {isDraft && onPublish && (
                  <Button variant="link" size="sm" disabled={disabled} onClick={() => setPending("publish")}>
                    Publicar
                  </Button>
                )}
                {isDraft && onDiscard && (
                  <Button variant="link" size="sm" disabled={disabled} onClick={() => setPending("discard")}>
                    Descartar
                  </Button>
                )}
                {onRestore && !inDesigner && (
                  <Button variant="link" size="sm" disabled={disabled} onClick={() => setPending("restore")}>
                    Restaurar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="text-meta text-muted">
          {version.createdAt && <>Guardada el {formatDateTime(version.createdAt)}</>}
          {version.publishedAt && (
            <>
              {version.createdAt && " · "}Publicada el {formatDateTime(version.publishedAt)}
              {version.publishedBy && ` por ${version.publishedBy}`}
            </>
          )}
        </div>

        {pending === "publish" && onPublish && (
          <ConfirmBox
            label={`Confirmar publicación de ${version.version}`}
            actions={
              <>
                {cancel}
                <Button variant="primary" size="sm" disabled={disabled} onClick={confirm(() => onPublish(version))}>
                  Publicar {version.version}
                </Button>
              </>
            }
          >
            {version.version} será la versión vigente
            {currentVersion ? ` y ${currentVersion} pasará a Archivada.` : "."}
            {publishNotice?.(version) && <span className="mt-1 block text-amber">{publishNotice(version)}</span>}
          </ConfirmBox>
        )}
        {pending === "discard" && onDiscard && (
          <ConfirmBox
            label={`Confirmar descarte de ${version.version}`}
            actions={
              <>
                {cancel}
                <Button variant="primary" size="sm" disabled={disabled} onClick={confirm(() => onDiscard(version))}>
                  Descartar {version.version}
                </Button>
              </>
            }
          >
            {version.version} dejará de aparecer en el historial. Su número no se volverá a usar.
          </ConfirmBox>
        )}
        {pending === "restore" && onRestore && (
          <ConfirmBox
            label={`Confirmar restauración de ${version.version}`}
            actions={
              <>
                {cancel}
                <Button size="sm" disabled={disabled} onClick={confirm(() => onRestore(version, { publish: false }))}>
                  Restaurar como borrador
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={disabled}
                  onClick={confirm(() => onRestore(version, { publish: true }))}
                >
                  Restaurar y publicar
                </Button>
              </>
            }
          >
            Se creará un borrador con la configuración de {version.version} y se aplicará al Designer.
            {hasUnversionedChanges &&
              " Los cambios del Designer que no están en ninguna versión se guardarán antes como borrador."}
          </ConfirmBox>
        )}

        <ul className="mt-1 list-disc pl-4 text-body-sm text-ink-2">
          {version.changes.map((change, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: dos cambios pueden tener el mismo texto.
            <li key={`${index}-${change}`} className="mb-0.5">
              {change}
            </li>
          ))}
        </ul>
        {detail && (
          <div className="mt-2 rounded-md border border-line-soft bg-bg px-3 py-2">
            <div className="mb-1 text-label font-medium uppercase text-muted">Campos en esta versión</div>
            {fields.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5 text-meta text-ink-2">
                {fields.map((field, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: el id de un campo podría repetirse en datos viejos.
                  <li key={`${field.id}-${index}`} className="rounded border border-line bg-surface px-1.5 py-0.5">
                    {field.label}
                    <span className="text-muted"> · {field.type}</span>
                    {field.required && <span className="text-red"> · Obligatorio</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-muted">Esta versión no tiene campos.</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
