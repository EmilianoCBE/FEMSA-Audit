import { type FormEvent, useId, useState } from "react";
import { Button } from "@/shared/ui";
import { parseChanges } from "../lib/versionChanges";

type SaveVersionFormProps = {
  disabled?: boolean;
  onCancel: () => void;
  onSave: (changes: string[]) => void;
};

/** Pide la descripción de los cambios antes de guardar la configuración actual como versión. */
export function SaveVersionForm({ disabled, onCancel, onSave }: SaveVersionFormProps) {
  const id = useId();
  const [text, setText] = useState("");
  const changes = parseChanges(text);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (changes.length > 0) onSave(changes);
  }

  return (
    <form onSubmit={submit} className="mb-3.5 rounded-md border border-line bg-surface p-4">
      <label htmlFor={id} className="mb-1 block text-label font-medium uppercase text-muted">
        Cambios de esta versión
      </label>
      <textarea
        id={id}
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={"Uno por línea, ej.\nSe agregó el campo Riesgo residual"}
        className="w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
      />
      <p className="mt-1 text-meta text-muted">
        Se guarda la configuración actual del formulario como borrador. Publícala cuando esté lista.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={disabled || changes.length === 0}>
          Guardar versión
        </Button>
      </div>
    </form>
  );
}
