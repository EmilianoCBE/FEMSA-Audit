# Maple React Mockup Base

Base React + TypeScript migrada desde `app_builder_v2_1.html`. La prioridad de esta primera versión es conservar el parecido visual con el mockup original y dejar una estructura clara para que el equipo vaya reemplazando secciones por componentes React nativos.

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Estructura recomendada

- `src/design-system/tokens`: colores y tipografía oficiales del mockup.
- `src/design-system/atoms`: componentes mínimos reutilizables.
- `src/design-system/molecules`: combinaciones pequeñas como tabs, badges compuestos o buscadores.
- `src/features/app-builder`: base visual del App Builder migrada desde el HTML.

## Ruta de migración sugerida

1. Mantener `MockupShell` como referencia visual.
2. Extraer primero `Sidebar`, `Topbar`, `PageHeader`, `SubTabs`, `DataTable` e `InspectorPanel`.
3. Después dividir por features: `workflow`, `designer`, `inbox`.
4. Evitar colores sueltos en componentes; usar los tokens y variables CSS globales.

El CSS global conserva los nombres del mockup para que la comparación visual sea directa durante la migración.
