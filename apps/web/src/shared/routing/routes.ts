/**
 * Rutas absolutas de la aplicación. Úsalas en lugar de strings sueltos
 * para que renombrar una ruta sea un cambio en un solo lugar.
 */
export const ROUTES = {
  home: "/",
  inbox: "/bandeja",
  appBuilder: {
    root: "/app-builder",
    workflow: "/app-builder/workflow",
    designer: "/app-builder/designer",
  },
} as const;
