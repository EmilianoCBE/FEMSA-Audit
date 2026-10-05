# FEMSA Auditoría Interna — App Builder

Plataforma propia de FEMSA para reemplazar Archer Audit Risk. Este repositorio contiene el frontend del **App Builder**
(Workflow + Designer) y la base visual compartida.

| App | Stack | Repositorio |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router 7 | este repo |
| API | Node.js ≥ 22 + Express 5 (JavaScript, ES Modules) + `mssql` | [FEMSA-Audit-Backend](https://github.com/EmilianoCBE/FEMSA-Audit-Backend) |
| Base de datos | Azure SQL Database (SQL Server) | — |

## Puesta en marcha

```bash
npm install
npm run dev          # web en :5173
npm run build        # typecheck + build
```

En desarrollo, Vite reenvía `/api` a `http://127.0.0.1:3000`. Levanta la API desde
[FEMSA-Audit-Backend](https://github.com/EmilianoCBE/FEMSA-Audit-Backend) con `npm run dev` (ahí está cómo configurar
`.env` y el firewall de Azure). Para apuntar a otra URL usa `VITE_API_URL`.

La aplicación requiere iniciar sesión en `/login`. Consulta [la configuración de autenticación](https://github.com/EmilianoCBE/FEMSA-Audit-Backend/blob/main/AUTH.md)
para crear el esquema y usuarios en SQL y habilitar Microsoft Entra ID. El resto de los módulos conserva sus datos mock
detrás de sus servicios (`features/*/services/`).

## Arquitectura

```
React (navegador) ──/api──▶ Express (FEMSA-Audit-Backend) ──mssql──▶ Azure SQL
```

El navegador **nunca** se conecta a la base de datos: las credenciales solo viven en la API.

### Estructura (`src`)

```
app/            → composición: router, menú lateral (config), layout
features/       → un módulo por dominio (auth, inbox, app-builder/{workflow,designer,version-history})
shared/
  ├── api/httpClient.ts   → único punto que hace fetch
  ├── hooks/useQuery.ts   → carga con estados loading/error/reintento
  ├── ui/                 → design system (Button, DataTable, Tabs, QueryState…)
  └── routing/            → ROUTES, breadcrumbs, createTabbedRoute
styles/index.css → tokens de diseño (@theme)
```

Cada feature:

```
features/<feature>/
├── types.ts       # Modelos de dominio
├── data/          # Datos mock
├── services/      # Fuente de datos de la feature (hoy mock, después httpClient)
├── lib/           # Reglas de negocio puras (filtros, cálculos, mapeos estado→estilo)
├── components/    # Presentación: reciben datos por props
├── panels/        # Contenido de cada tab; usan useQuery(service.metodo)
├── pages/         # Pantalla: header + tabs + <Outlet />
├── tabs.tsx       # Tabs enrutados (si aplica)
└── routes.tsx     # Rutas que la feature expone al router
```

Flujo de datos: `componente → useQuery → service → (mock hoy / httpClient → API después)`. Los componentes no saben de `fetch` ni de URLs.

### API

La API vive en [FEMSA-Audit-Backend](https://github.com/EmilianoCBE/FEMSA-Audit-Backend), que documenta su
estructura, endpoints y cómo agregar tablas.

## Principios SOLID aplicados

| Principio | Dónde se ve |
| --- | --- |
| **S** — Responsabilidad única | Web: servicios, reglas (`lib/`), presentación y páginas separados. |
| **O** — Abierto/cerrado | Menú, tabs, filtros de bandeja, columnas de `DataTable`: se extienden agregando entradas. |
| **L** — Sustitución de Liskov | `Button`, `Badge`, `FilterChip` extienden las props nativas de HTML. |
| **I** — Segregación de interfaces | Props y servicios pequeños y específicos por feature. |
| **D** — Inversión de dependencias | Componentes dependen de servicios, no de la fuente de datos: pasar de mock a API no los modifica. |

## Estilos (Tailwind)

- Tokens en `src/styles/index.css` (`@theme`): `--color-accent` → `bg-accent`, `text-accent`…
- **No uses colores hex en componentes.** Si falta un valor, agrégalo como token.
- Si agregas un tamaño `--text-*`, agrégalo también en `shared/lib/cn.ts` (para `tailwind-merge`).
- Breakpoint `desktop:` (≥ 901px).

## Cómo implementar una historia de usuario

1. Busca tu historia: `grep -rn "TODO(US07" src` — el TODO está donde empieza el trabajo.
2. **Web:** define el tipo en `types.ts`, los datos en `data/*.mock.ts`, el método en `services/`,
   y consúmelo con `useQuery` + `<QueryState>`. La lógica va en funciones puras dentro de `lib/`.
3. **API (cuando haya tablas):** se implementa en el repo [FEMSA-Audit-Backend](https://github.com/EmilianoCBE/FEMSA-Audit-Backend).
4. **Pantalla o tab nueva:** tab → entrada en `tabs.tsx`; pantalla → `features/<modulo>/routes.tsx`,
   ruta en `shared/routing/routes.ts`, registro en `app/router.tsx` y `to` en `app/navigation.ts`.
5. Corre `npm run build` antes de subir cambios.

### Mapa de historias

| US | Responsable | Archivo de entrada |
| --- | --- | --- |
| US01 | Rafael Valdez | `web: features/auth/hooks/useCurrentUser.ts`, `web: app/router.tsx` |
| US02 | Karla Alessandra | `web: app/navigation.ts` (nuevo módulo Usuarios y roles) |
| US03 | Magda Colunga | `web: app-builder/designer/panels/FieldsPanel.tsx` |
| US04 | Rafael Valdez | `web: workflow/components/canvas/WorkflowStateNode.tsx` |
| US05 | Juan Aguilar | `web: app-builder/workflow/panels/FlowPanel.tsx` |
| US06 | Juan Aguilar | `web: styles/index.css` |
| US07 | Karla Alessandra | `web: app-builder/designer/panels/FieldsPanel.tsx` |
| US08 | Leonel | `web: app/layout/topbar/Topbar.tsx` |
| US09 | Magda Colunga | `web: app/navigation.ts` (módulo Reportes) |
| US10 | Juan Aguilar | `web: app/layout/topbar/Topbar.tsx` |
| US11 | Rafael Valdez | `web: version-history/data/versions.mock.ts` |
| US12 | Leonel | `web: version-history/components/VersionHistoryPanel.tsx` |
| US13 | Magda Colunga | `web: app-builder/designer/panels/PermissionsPanel.tsx` |
| US14 | Leonel | `web: designer/panels/PermissionsPanel.tsx`, `web: features/auth` |
| US15–US17 | Emiliano Carrizales | `web: workflow/components/inspector/DesignAssistantPanel.tsx` |
| US18 | Karla Alessandra | `web: workflow/components/inspector/DesignAssistantPanel.tsx` |


### Importante 
### Recuerden agregar el .env al backend y usar un usuario y contraseña que este en la bd
### Si no lo habian agregado darle save y correr primero el back y luego el front. 