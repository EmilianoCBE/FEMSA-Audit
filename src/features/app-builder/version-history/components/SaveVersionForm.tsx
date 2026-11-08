import { type FormEvent, useId, useState } from "react";
import { Button } from "@/shared/ui";
import { MAX_CHANGES, parseChanges, validateChangesText } from "../lib/versionChanges";

type SaveVersionFormProps = {
  /** Cambios sugeridos (uno por línea), calculados comparando el Designer con la versión más reciente. */
  initialText?: string;
  disabled?: boolean;
  onCancel: () => void;
  onSave: (changes: string[]) => void;
};

/** Pide la descripción de los cambios antes de guardar la configuración actual como versión. */
export function SaveVersionForm({ initialText = "", disabled, onCancel, onSave }: SaveVersionFormProps) {
  const id = useId();
  const [text, setText] = useState(initialText);
  const changes = parseChanges(text);
  const problem = validateChangesText(changes);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (changes.length > 0 && !problem) onSave(changes);
  }

  return (
    <form onSubmit={submit} className="mb-3.5 rounded-md border border-line bg-surface p-4">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-label font-medium uppercase text-muted">
          Cambios de esta versión
        </label>
        <span className={`text-meta ${changes.length > MAX_CHANGES ? "text-red" : "text-muted"}`}>
          {changes.length} de {MAX_CHANGES} cambios
        </span>
      </div>
      <textarea
        id={id}
        rows={4}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={"Uno por línea, ej.\nSe agregó el campo Riesgo residual"}
        aria-invalid={problem ? true : undefined}
        aria-describedby={`${id}-help`}
        className="w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
      />
      {problem && <p className="mt-1 text-meta text-red">{problem}</p>}
      <p id={`${id}-help`} className="mt-1 text-meta text-muted">
        {initialText &&
          "Se sugirieron los cambios comparando el Designer con la versión más reciente; edítalos si hace falta. "}
        Se guarda lo que está guardado en la pestaña Campos, como borrador. Publícalo cuando esté listo.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={disabled || changes.length === 0 || Boolean(problem)}>
          Guardar versión
        </Button>
      </div>
    </form>
  );
}
