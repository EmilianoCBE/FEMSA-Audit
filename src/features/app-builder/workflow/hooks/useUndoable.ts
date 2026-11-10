import { useCallback, useState } from "react";

// Fase 2 del workflow - Emiliano Carrizales: historial para "Deshacer" / "Rehacer" en el editor del flujo.

const LIMIT = 50;

type History<T> = { past: T[]; present: T; future: T[] };

export function useUndoable<T>(initial: () => T) {
  const [history, setHistory] = useState<History<T>>(() => ({ past: [], present: initial(), future: [] }));

  /** Cambio que se puede deshacer. Si la función regresa el mismo valor, no se agrega al historial. */
  const commit = useCallback((update: (current: T) => T) => {
    setHistory((previous) => {
      const next = update(previous.present);
      if (Object.is(next, previous.present)) return previous;
      return { past: [...previous.past, previous.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  /** Cambio intermedio (mientras se arrastra un estado): no entra al historial hasta `checkpoint`. */
  const preview = useCallback((update: (current: T) => T) => {
    setHistory((previous) => ({ ...previous, present: update(previous.present) }));
  }, []);

  /** Guarda en el historial cómo estaba antes de un cambio intermedio (al soltar el estado arrastrado). */
  const checkpoint = useCallback((before: T) => {
    setHistory((previous) =>
      Object.is(before, previous.present)
        ? previous
        : { past: [...previous.past, before].slice(-LIMIT), present: previous.present, future: [] },
    );
  }, []);

  const undo = useCallback(() => {
    setHistory((previous) => {
      const before = previous.past.at(-1);
      if (before === undefined) return previous;
      return { past: previous.past.slice(0, -1), present: before, future: [previous.present, ...previous.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((previous) => {
      const [after, ...rest] = previous.future;
      if (after === undefined) return previous;
      return { past: [...previous.past, previous.present], present: after, future: rest };
    });
  }, []);

  /** Nuevo punto de partida sin historial (al cargar otro formulario o descartar cambios). */
  const reset = useCallback((value: T) => setHistory({ past: [], present: value, future: [] }), []);

  return {
    value: history.present,
    commit,
    preview,
    checkpoint,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
