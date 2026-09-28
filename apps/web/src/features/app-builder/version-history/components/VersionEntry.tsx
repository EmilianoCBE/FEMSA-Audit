import { Button } from "@/shared/ui";
import { formatPublishedAt } from "../lib/formatPublishedAt";
import type { AppVersion } from "../types";
import { VersionStatusBadge } from "./VersionStatusBadge";

type VersionEntryProps = {
  version: AppVersion;
  onView?: (version: AppVersion) => void;
};

export function VersionEntry({ version, onView }: VersionEntryProps) {
  return (
    <article className="flex gap-3.5 border-b border-line py-3.5 last:border-b-0">
      <div className="w-[70px] flex-none text-right">
        <div className="text-body font-semibold">{version.version}</div>
        <div className="mt-0.5 text-meta text-muted">{formatPublishedAt(version.publishedAt)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[5px] flex items-center gap-2">
          <VersionStatusBadge status={version.status} />
          <span className="text-body-sm text-ink-2">{version.author}</span>
          <div className="ml-auto flex flex-none gap-1.5">
            <Button variant="link" size="sm" onClick={() => onView?.(version)}>
              Ver
            </Button>
          </div>
        </div>
        <ul className="mt-1 list-disc pl-4 text-body-sm text-ink-2">
          {version.changes.map((change) => (
            <li key={change} className="mb-0.5">
              {change}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
