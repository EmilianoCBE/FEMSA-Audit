import type { ReactNode } from "react";
import { Navigate, type RouteObject } from "react-router";
import type { RouteTab } from "@/shared/ui";
import type { RouteHandle } from "./handle";

/** Tab enrutado: metadatos del tab + contenido que se renderiza en su ruta. */
export type TabRoute = RouteTab & {
  element: ReactNode;
};

type TabbedRouteConfig = {
  path: string;
  /** Página contenedora; debe renderizar <Outlet /> donde va el contenido del tab. */
  element: ReactNode;
  breadcrumb: readonly string[];
  tabs: readonly TabRoute[];
};

/**
 * Construye una ruta cuyas subrutas son tabs. La primera tab es la vista por defecto.
 * Agregar una tab = agregar un elemento al arreglo `tabs`; no hay que tocar el router.
 */
export function createTabbedRoute({ path, element, breadcrumb, tabs }: TabbedRouteConfig): RouteObject {
  const [defaultTab] = tabs;
  return {
    path,
    element,
    handle: { breadcrumb } satisfies RouteHandle,
    children: [
      ...(defaultTab ? [{ index: true, element: <Navigate to={defaultTab.path} replace /> }] : []),
      ...tabs.map((tab) => ({ path: tab.path, element: tab.element })),
    ],
  };
}
