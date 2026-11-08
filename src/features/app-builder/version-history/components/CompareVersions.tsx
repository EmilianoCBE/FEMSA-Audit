import { useEffect, useId, useState } from "react";
import { Button } from "@/shared/ui";
import { type ConfigDiff, diffConfigs, isEmptyDiff } from "../lib/compareVersions";
import type { AppConfig, AppVersion } from "../types";

/** Valor del selector para comparar contra el lienzo actual del Designer (cambios que aún no son versión). */
export const DESIGNER_OPTION = "designer";

type CompareVersionsProps = {
  versions: AppVersion[];
  /** El Designer tiene cambios sin versión: se ofrece compararlo como "Designer actual". */
  hasUnversionedChanges: boolean;
  /** Devuelve la configuración de una versión (por id) o del Designer (`DESIGNER_OPTION`). */
  loadConfig: (id: string) => Promise<AppConfig>;
  onClose: () => void;
};

type DiffState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; diff: ConfigDiff };

function defaultPair(versions: AppVersion[], hasUnversionedChanges: boolean) {
  const current = versions.find((version) => version.status === "current");
  if (hasUnversionedChanges) return { from: (current ?? versions[0]).id, to: DESIGNER_OPTION };
  const to = versions[0].id;
  const from = (current && current.id !== to ? current : (versions[1] ?? versions[0])).id;
  return { from, to };
}

function DiffList({ title, tone, items }: { title: string; tone: string; items: { id: string; text: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`mb-1 text-label font-medium uppercase ${tone}`}>
        {title} ({items.length})
      </div>
      <ul className="mb-2 list-disc pl-4 text-body-sm text-ink-2">
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}

/** Muestra qué campos se agregaron, quitaron o modificaron entre dos versiones (o contra el Designer). */
export function CompareVersions({ versions, hasUnversionedChanges, loadConfig, onClose }: CompareVersionsProps) {
  const id = useId();
  const [pair, setPair] = useState(() => defaultPair(versions, hasUnversionedChanges));
  const [state, setState] = useState<DiffState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    Promise.all([loadConfig(pair.from), loadConfig(pair.to)])
      .then(([before, after]) => {
        if (!cancelled) setState({ status: "ready", diff: diffConfigs(before, after) });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setState({ status: "error", message: reason instanceof Error ? reason.message : "No se pudo comparar." });
      });
    return () => {
      cancelled = true;
    };
  }, [pair, loadConfig]);

  const options = [
    ...(hasUnversionedChanges ? [{ value: DESIGNER_OPTION, label: "Designer actual (sin versión)" }] : []),
    ...versions.map((version) => ({ value: version.id, label: version.version })),
  ];
  const labelOf = (value: string) => options.find((option) => option.value === value)?.label ?? value;
  const select = (key: "from" | "to", label: string) => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-1 block text-label font-medium uppercase text-muted">
        {label}
      </label>
      <select
        id={`${id}-${key}`}
        className="rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
        value={pair[key]}
        onChange={(event) => setPair((current) => ({ ...current, [key]: event.target.value }))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section aria-label="Comparar versiones" className="mb-3.5 rounded-md border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        {select("from", "Desde")}
        <span className="pb-2 text-muted">→</span>
        {select("to", "Hasta")}
        <Button className="ml-auto" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {pair.from === pair.to ? (
        <p className="text-body-sm text-muted">Elige dos versiones distintas.</p>
      ) : state.status === "loading" ? (
        <p className="text-body-sm text-muted">Comparando…</p>
      ) : state.status === "error" ? (
        <p role="alert" className="text-body-sm text-red">
          {state.message}
        </p>
      ) : isEmptyDiff(state.diff) ? (
        <p className="text-body-sm text-muted">
          No hay diferencias en los campos entre {labelOf(pair.from)} y {labelOf(pair.to)}.
        </p>
      ) : (
        <>
          <DiffList
            title="Campos agregados"
            tone="text-green"
            items={state.diff.added.map((field) => ({ id: field.id, text: field.label }))}
          />
          <DiffList
            title="Campos quitados"
            tone="text-red"
            items={state.diff.removed.map((field) => ({ id: field.id, text: field.label }))}
          />
          <DiffList
            title="Campos modificados"
            tone="text-amber"
            items={state.diff.changed.map((field) => ({
              id: field.id,
              text: `${field.label}: ${field.details.join("; ")}`,
            }))}
          />
        </>
      )}
    </section>
  );
}
