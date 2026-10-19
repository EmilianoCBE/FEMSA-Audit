import { useState } from "react";
import { Button } from "@/shared/ui";
import { formatPublishedAt } from "../lib/formatPublishedAt";
import { describeConfig } from "../lib/versionChanges";
import type { AppVersion, AppVersionDetail } from "../types";
import { VersionStatusBadge } from "./VersionStatusBadge";

type VersionEntryProps = {
  version: AppVersion;
  /** Detalle cargado al pulsar "Ver"; si existe, se muestra la configuración guardada. */
  detail?: AppVersionDetail;
  disabled?: boolean;
  onView?: (version: AppVersion) => void;
  onPublish?: (version: AppVersion) => void;
  onRestore?: (version: AppVersion) => void;
};

export function VersionEntry({ version, detail, disabled, onView, onPublish, onRestore }: VersionEntryProps) {
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  const fields = detail ? describeConfig(detail.config) : [];

  return (
    <article
      className="flex gap-3.5 border-b border-line py-3.5 last:border-b-0"
      aria-label={`Versión ${version.version}`}
    >
      <div className="w-[70px] flex-none text-right">
        <div className="text-body font-semibold">{version.version}</div>
        <div className="mt-0.5 text-meta text-muted">{formatPublishedAt(version.publishedAt)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[5px] flex flex-wrap items-center gap-2">
          <VersionStatusBadge status={version.status} />
          <span className="text-body-sm text-ink-2">{version.author}</span>
          {version.restoredFrom && <span className="text-meta text-muted">Restaurada de {version.restoredFrom}</span>}
          <div className="ml-auto flex flex-none gap-1.5">
            <Button variant="link" size="sm" onClick={() => onView?.(version)}>
              {detail ? "Ocultar" : "Ver"}
            </Button>
            {version.status === "draft" && onPublish && (
              <Button variant="link" size="sm" disabled={disabled} onClick={() => onPublish(version)}>
                Publicar
              </Button>
            )}
            {onRestore && !confirmingRestore && (
              <Button variant="link" size="sm" disabled={disabled} onClick={() => setConfirmingRestore(true)}>
                Restaurar
              </Button>
            )}
          </div>
        </div>
        {confirmingRestore && onRestore && (
          <fieldset
            aria-label={`Confirmar restauración de ${version.version}`}
            className="my-2 flex flex-wrap items-center gap-2 rounded-md border border-line bg-bg px-3 py-2 text-body-sm text-ink-2"
          >
            <span>
              Se creará un borrador con la configuración de {version.version} y se aplicará al formulario del Designer.
            </span>
            <div className="ml-auto flex gap-1.5">
              <Button size="sm" onClick={() => setConfirmingRestore(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  setConfirmingRestore(false);
                  onRestore(version);
                }}
              >
                Restaurar {version.version}
              </Button>
            </div>
          </fieldset>
        )}
        <ul className="mt-1 list-disc pl-4 text-body-sm text-ink-2">
          {version.changes.map((change) => (
            <li key={change} className="mb-0.5">
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
                  // biome-ignore lint/suspicious/noArrayIndexKey: dos campos pueden tener la misma etiqueta.
                  <li key={`${field}-${index}`} className="rounded border border-line bg-surface px-1.5 py-0.5">
                    {field}
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
