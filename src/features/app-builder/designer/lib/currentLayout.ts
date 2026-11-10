import { useSyncExternalStore } from "react";

// Workflow (fase 2) - Emiliano Carrizales: qué formulario está abierto en el Designer, para que el panel "Flujo del
// proceso" (US05, arriba de las pestañas) muestre el flujo de ese formulario y no uno de ejemplo.

let currentLayoutId: string | undefined;
const listeners = new Set<() => void>();

export function setCurrentDesignerLayout(id: string | undefined) {
  if (id === currentLayoutId) return;
  currentLayoutId = id;
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCurrentDesignerLayout = () => useSyncExternalStore(subscribe, () => currentLayoutId);
