# FEMSA Auditoría Interna — App Builder

Plataforma propia de FEMSA para reemplazar Archer Audit Risk. Este repositorio contiene el **App Builder**
(Workflow + Designer) y la base visual compartida que usarán los demás módulos.

Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router 7**.

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run typecheck  # tsc sin emitir
npm run build
```

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/bandeja` | Mi bandeja |
| `/app-builder/workflow/{flow,rules,notifications,history}` | Workflow (cada tab es una URL) |
| `/app-builder/designer/{fields,permissions,validations,history}` | Designer |

## Estructura

```
src/
├── app/                      # Composición de la aplicación (no contiene lógica de negocio)
│   ├── App.tsx               # RouterProvider
│   ├── router.tsx            # Ensambla las rutas que expone cada feature
│   ├── navigation.ts         # Menú lateral declarativo
│   └── layout/               # AppLayout, Sidebar, Topbar
├── features/                 # Un módulo por dominio; cada uno es autocontenido
│   ├── auth/                 # Usuario actual (hook useCurrentUser)
│   ├── inbox/                # Mi bandeja
│   └── app-builder/
│       ├── routes.tsx
│       ├── workflow/
│       ├── designer/
│       └── version-history/  # Reutilizado por Workflow y Designer
├── shared/                   # Código sin conocimiento de ningún dominio
│   ├── ui/                   # Design system (Button, Badge, DataTable, Tabs, ...)
│   ├── routing/              # ROUTES, breadcrumbs, createTabbedRoute
│   ├── hooks/
│   └── lib/cn.ts             # clsx + tailwind-merge
└── styles/index.css          # Tokens de diseño (@theme) — única fuente de colores y tipografía
```

Cada feature sigue la misma forma:

```
features/<feature>/
├── types.ts        # Modelos de dominio (sin React)
├── data/*.mock.ts  # Datos de ejemplo; se reemplazarán por servicios/API
├── lib/            # Reglas de negocio puras (filtros, cálculos, mapeos estado→estilo)
├── components/     # Componentes de presentación de la feature
├── panels/         # Contenido de cada tab (si la pantalla tiene tabs)
├── pages/          # Pantalla completa: header + tabs + <Outlet />
├── tabs.tsx        # Declaración de tabs enrutados (si aplica)
├── routes.tsx      # Rutas que la feature expone al router
└── index.ts        # API pública (solo si otra feature la consume)
```

### Reglas de dependencia

- `shared/` **no importa** de `features/` ni de `app/`.
- Una feature **no importa** de otra salvo por su `index.ts` (ej. `@/features/auth`).
- `app/` solo compone: importa rutas y layout, no define pantallas.
- Usa el alias `@/` para imports entre carpetas de primer nivel y rutas relativas dentro de la misma feature.

## Principios SOLID aplicados

| Principio | Dónde se ve |
| --- | --- |
| **S** — Responsabilidad única | Datos (`data/`), reglas (`lib/`), presentación (`components/`) y composición (`pages/`) viven separados. `WorkflowCanvas` solo dibuja; no sabe de dónde vienen los estados. |
| **O** — Abierto/cerrado | Menú (`navigation.ts`), tabs (`tabs.tsx`), filtros de bandeja (`INBOX_FILTERS`), estilos de transición (`VARIANT_STYLES`) y columnas de `DataTable` son configuración: se extienden agregando entradas, sin editar el componente. |
| **L** — Sustitución de Liskov | `Button`, `Badge`, `FilterChip` extienden las props nativas de HTML: se usan donde se usaría un `<button>`/`<span>`. |
| **I** — Segregación de interfaces | Props pequeñas y específicas (`SeverityIndicator` recibe `severity`, no el hallazgo completo). |
| **D** — Inversión de dependencias | Los componentes dependen de tipos y props, no de la fuente de datos. `useCurrentUser()` aísla la sesión: cambiar el mock por Microsoft Entra ID no toca la UI. |

## Estilos (Tailwind)

- Los tokens están en `src/styles/index.css` dentro de `@theme`. Cada token genera utilidades:
  `--color-accent` → `bg-accent`, `text-accent`, `border-accent`; `--text-body-sm` → `text-body-sm`.
- **No uses colores hex en componentes.** Si falta un valor, agrégalo como token.
- Si agregas un tamaño de fuente `--text-*`, agrégalo también en `src/shared/lib/cn.ts`
  (si no, `tailwind-merge` lo confunde con un color).
- Combina clases con `cn()`; para componentes con variantes usa `cva` (ver `shared/ui/Button.tsx`).
- Breakpoint `desktop:` (≥ 901px): por debajo se ocultan sidebar e inspector, igual que el mockup.

## Cómo implementar una historia de usuario

1. Busca tu historia: `grep -rn "TODO(US07" src` — el TODO está en el archivo donde empieza el trabajo.
2. Modela primero el dominio en `types.ts` y los datos en `data/*.mock.ts`.
3. Pon la lógica en funciones puras dentro de `lib/`.
4. Construye la UI con componentes de `@/shared/ui`. Si necesitas un componente genérico nuevo, agrégalo a `shared/ui` y expórtalo en su `index.ts`.
5. ¿Pantalla o tab nueva?
   - **Tab** en una pantalla existente: agrega una entrada en el `tabs.tsx` de la feature.
   - **Pantalla** nueva: crea `features/<modulo>/` con `pages/` y `routes.tsx`, agrega la ruta en `shared/routing/routes.ts`, regístrala en `app/router.tsx` y agrega el `to` en `app/navigation.ts`.
6. Corre `npm run typecheck` antes de subir cambios.

### Mapa de historias

| US | Responsable | Archivo de entrada |
| --- | --- | --- |
| US01 | Rafael Valdez | `features/auth/hooks/useCurrentUser.ts`, `app/router.tsx` |
| US02 | Karla Alessandra | `app/navigation.ts` (nuevo módulo Usuarios y roles) |
| US03 | Magda Colunga | `app-builder/designer/panels/FieldsPanel.tsx` |
| US04 | Rafael Valdez | `app-builder/workflow/components/canvas/WorkflowStateNode.tsx` |
| US05 | Juan Aguilar | `app-builder/workflow/panels/FlowPanel.tsx` |
| US06 | Juan Aguilar | `styles/index.css` |
| US07 | Karla Alessandra | `app-builder/designer/panels/FieldsPanel.tsx` |
| US08 | Leonel | `app/layout/topbar/Topbar.tsx` |
| US09 | Magda Colunga | `app/navigation.ts` (módulo Reportes) |
| US10 | Juan Aguilar | `app/layout/topbar/Topbar.tsx` |
| US11 | Rafael Valdez | `app-builder/version-history/data/versions.mock.ts` |
| US12 | Leonel | `app-builder/version-history/components/VersionHistoryPanel.tsx` |
| US13 | Magda Colunga | `app-builder/designer/panels/PermissionsPanel.tsx` |
| US14 | Leonel | `app-builder/designer/panels/PermissionsPanel.tsx`, `features/auth` |
| US15–US17 | Emiliano Carrizales | `app-builder/workflow/components/inspector/DesignAssistantPanel.tsx` |
| US18 | Karla Alessandra | `app-builder/workflow/components/inspector/DesignAssistantPanel.tsx` |

## Próximos pasos sugeridos

- Capa de servicios por feature (`services/`) con interfaces + implementación mock, consumida vía hooks, para conectar el backend sin tocar componentes.
- ESLint + Prettier (`prettier-plugin-tailwindcss` para ordenar clases) y Vitest para `lib/`.
