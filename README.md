# FEMSA Auditoría Interna — App Builder

Plataforma propia de FEMSA para reemplazar Archer Audit Risk. Este repositorio contiene el **App Builder**
(Workflow + Designer), la base visual compartida y la API conectada a Azure SQL.

| App | Stack | Carpeta |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router 7 | `apps/web` |
| API | Node.js ≥ 22 + Express 5 (JavaScript, ES Modules) + `mssql` | `apps/api` |
| Base de datos | Azure SQL Database (SQL Server) — `femsa-101.database.windows.net` / `plantacion` | — |

## Puesta en marcha

### 1. Dependencias

```bash
npm install          # instala web y api (npm workspaces) desde la raíz
```

### 2. Conexión a Azure SQL

1. Crea `apps/api/.env` con `DB_SERVER`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` de tu instancia de Azure SQL.
   **`.env` nunca se sube al repo** (está en `.gitignore`).
2. Permite tu IP en el firewall: Azure Portal → SQL Server `femsa-101` → *Redes* → *Agregar la dirección IPv4 del cliente*.
   Cada integrante debe agregar la suya (y actualizarla si cambia de red).

### 3. Desarrollo

```bash
npm run dev          # API en :3000 y web en :5173 al mismo tiempo
npm run dev:web      # solo frontend
npm run dev:api      # solo API (nodemon, se reinicia al guardar)
npm run build        # typecheck + build del frontend
```

Verifica la conexión en <http://127.0.0.1:3000/api/health> → `{"status":"ok","database":"ok"}`.
Si la API no logra conectarse, arranca igual y muestra en consola qué revisar.

La aplicación requiere iniciar sesión en `/login`. Consulta [la configuración de autenticación](apps/api/AUTH.md)
para crear el esquema y usuarios en SQL y habilitar Microsoft Entra ID. El resto de los módulos conserva sus datos mock
detrás de sus servicios (`features/*/services/`).

## Arquitectura

```
React (navegador) ──/api──▶ Express (apps/api) ──mssql──▶ Azure SQL
```

El navegador **nunca** se conecta a la base de datos: las credenciales solo viven en la API.

### Frontend (`apps/web/src`)

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

### API (`apps/api`)

Misma estructura que la REST API vista en clase (Express + dotenv + cors + morgan + nodemon), con SQL Server en lugar de MongoDB:

```
index.js          → carga .env, conecta a la BD y levanta el servidor
app.js            → middlewares (morgan, cors, json) y rutas bajo /api
db/db.js          → configuración de Azure SQL y pool de conexiones compartido (getPool)
routes/           → define endpoints        (index.routes.js)
controllers/      → req/res                 (index.controller.js)
middlewares/      → 404 y manejo central de errores
utils/            → errores HTTP (HttpError, badRequest, notFoundError)
```

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/ping` | `{"msg":"pong"}` |
| GET | `/api/health` | Estado de la conexión a la base de datos (503 si no responde) |

Los errores responden `{ "msg": "..." }` con su código HTTP.

#### Al agregar tablas y endpoints

Sigue el flujo `routes → controllers → services → repositories`:

- `repositories/<modulo>.repository.js` — solo SQL. Usa `const pool = await getPool()` y **siempre** parámetros
  (`.input("id", sql.Int, id)`), nunca concatenes valores del usuario en el SQL.
- `services/<modulo>.service.js` — reglas de negocio y validación (lanza `badRequest()` / `notFoundError()`).
- `controllers/<modulo>.controller.js` — `export const getX = async (req, res) => res.json(await service())`.
  Express 5 manda los errores al `errorHandler`, no hace falta `try/catch`.
- `routes/<modulo>.routes.js` — y regístralo en `app.js` con `app.use("/api", ...)`.

## Principios SOLID aplicados

| Principio | Dónde se ve |
| --- | --- |
| **S** — Responsabilidad única | Web: servicios, reglas (`lib/`), presentación y páginas separados. API: rutas, controladores (HTTP), conexión (`db/`) y errores separados. |
| **O** — Abierto/cerrado | Menú, tabs, filtros de bandeja, columnas de `DataTable`, routers de la API: se extienden agregando entradas. |
| **L** — Sustitución de Liskov | `Button`, `Badge`, `FilterChip` extienden las props nativas de HTML. |
| **I** — Segregación de interfaces | Props y servicios pequeños y específicos por feature. |
| **D** — Inversión de dependencias | Componentes dependen de servicios, no de la fuente de datos: pasar de mock a API no los modifica. |

## Estilos (Tailwind)

- Tokens en `apps/web/src/styles/index.css` (`@theme`): `--color-accent` → `bg-accent`, `text-accent`…
- **No uses colores hex en componentes.** Si falta un valor, agrégalo como token.
- Si agregas un tamaño `--text-*`, agrégalo también en `shared/lib/cn.ts` (para `tailwind-merge`).
- Breakpoint `desktop:` (≥ 901px).

## Cómo implementar una historia de usuario

1. Busca tu historia: `grep -rn "TODO(US07" apps` — el TODO está donde empieza el trabajo.
2. **Web:** define el tipo en `types.ts`, los datos en `data/*.mock.ts`, el método en `services/`,
   y consúmelo con `useQuery` + `<QueryState>`. La lógica va en funciones puras dentro de `lib/`.
3. **API (cuando haya tablas):** repositorio → servicio → controlador → ruta (ver sección API).
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

## Pendiente

- Diseñar y crear las tablas en Azure SQL, y cambiar los servicios del frontend de mock a `httpClient`.
- Autenticación de la API (US01/US14).
- ESLint + Prettier y Vitest.
