import { useEffect } from "react";
import { useBlocker } from "react-router";

/**
 * Mientras `hasUnsavedChanges` sea true:
 * - detiene la navegación dentro de la app (ej. cambiar de pestaña) para que la pantalla pregunte qué hacer, y
 * - pide confirmación del navegador al recargar o cerrar la pestaña.
 * Devuelve el blocker: `state === "blocked"` -> mostrar el aviso; `proceed()` sale y `reset()` se queda.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);

  return blocker;
}
