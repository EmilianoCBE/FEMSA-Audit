import { useMatches } from "react-router";

/** Metadatos que cada ruta puede declarar en `handle`. */
export type RouteHandle = {
  breadcrumb?: readonly string[];
};

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return typeof handle === "object" && handle !== null;
}

/** Devuelve el breadcrumb declarado por la ruta activa más profunda. */
export function useBreadcrumb(): readonly string[] {
  const matches = useMatches();
  for (let index = matches.length - 1; index >= 0; index--) {
    const { handle } = matches[index];
    if (isRouteHandle(handle) && handle.breadcrumb) return handle.breadcrumb;
  }
  return [];
}
