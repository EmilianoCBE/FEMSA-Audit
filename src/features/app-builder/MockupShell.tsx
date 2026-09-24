import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  Inbox,
  LayoutGrid,
  Library,
  Search,
  UserCircle,
} from "lucide-react";

type Screen = "workflow" | "designer" | "inbox";
type WorkflowTab = "flow" | "rules" | "notifications" | "history";
type DesignerTab = "fields" | "permissions" | "validations" | "history";

const screenLabels: Record<Screen, string> = {
  workflow: "Workflow",
  designer: "Designer",
  inbox: "Mi bandeja",
};

export function MockupShell() {
  const [screen, setScreen] = useState<Screen>("workflow");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("flow");
  const [designerTab, setDesignerTab] = useState<DesignerTab>("fields");
  const [showAi, setShowAi] = useState(false);

  const goToScreen = (nextScreen: Screen) => {
    setScreen(nextScreen);
    setShowAi(false);
    if (nextScreen === "workflow") setWorkflowTab("flow");
    if (nextScreen === "designer") setDesignerTab("fields");
  };

  return (
    <div className="shell">
      <Sidebar activeScreen={screen} onNavigate={goToScreen} />
      <main className="main">
        <Topbar activeScreen={screen} />
        {screen === "workflow" && (
          <WorkflowScreen activeTab={workflowTab} onChangeTab={setWorkflowTab} showAi={showAi} onShowAi={setShowAi} />
        )}
        {screen === "designer" && <DesignerScreen activeTab={designerTab} onChangeTab={setDesignerTab} />}
        {screen === "inbox" && <InboxScreen />}
      </main>
    </div>
  );
}

function Sidebar({ activeScreen, onNavigate }: { activeScreen: Screen; onNavigate: (screen: Screen) => void }) {
  const appBuilderIsActive = activeScreen === "workflow" || activeScreen === "designer";

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">FEMSA</span>
        <span className="sep" />
        <span className="sys">Auditoría Interna</span>
      </div>
      <div className="searchbox">
        <Search size={12} />
        <input placeholder="Buscar auditorías, hallazgos..." />
      </div>
      <nav>
        <NavGroup label="Gestión de auditoría">
          <NavButton active={activeScreen === "inbox"} icon={<Inbox />} onClick={() => onNavigate("inbox")}>
            Mi bandeja <span className="nav-count">7</span>
          </NavButton>
          <NavButton icon={<Calendar />}>Plan anual</NavButton>
          <NavButton icon={<FileText />}>Auditorías</NavButton>
          <NavButton icon={<AlertTriangle />}>Hallazgos</NavButton>
          <NavButton icon={<CheckSquare />}>Planes de acción</NavButton>
        </NavGroup>
        <NavGroup label="Contenido" owner="Equipo B">
          <NavButton icon={<Library />}>Biblioteca de riesgos</NavButton>
          <NavButton icon={<LayoutGrid />}>Catálogo de controles</NavButton>
          <NavButton icon={<FileText />}>Evidencias</NavButton>
        </NavGroup>
        <NavGroup label="Reportes" owner="Equipo C">
          <NavButton icon={<BarChart3 />}>Tableros</NavButton>
          <NavButton icon={<FileText />}>Reportes ejecutivos</NavButton>
        </NavGroup>
        <NavGroup label="Configuración" owner="Equipo A">
          <NavButton active={appBuilderIsActive} icon={<LayoutGrid />} onClick={() => onNavigate("workflow")}>
            App Builder
          </NavButton>
          <div className="nav-sub">
            <NavButton active={activeScreen === "workflow"} onClick={() => onNavigate("workflow")}>
              Workflow
            </NavButton>
            <NavButton active={activeScreen === "designer"} onClick={() => onNavigate("designer")}>
              Designer
            </NavButton>
          </div>
          <NavButton icon={<UserCircle />}>Usuarios y roles</NavButton>
        </NavGroup>
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">AA</div>
        <div>
          <div className="who">Alicia Alemán</div>
          <div className="role">Administrador</div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ label, owner, children }: { label: string; owner?: string; children: React.ReactNode }) {
  return (
    <div className="nav-group">
      <div className="label">
        {label}
        {owner && <span className="owner">{owner}</span>}
      </div>
      {children}
    </div>
  );
}

function NavButton({ active = false, icon, onClick, children }: { active?: boolean; icon?: React.ReactElement; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button className={`nav-item${active ? " active" : ""}`} onClick={onClick} type="button">
      {icon && <span className="ico">{icon}</span>}
      {children}
    </button>
  );
}

function Topbar({ activeScreen }: { activeScreen: Screen }) {
  const isInbox = activeScreen === "inbox";

  return (
    <div className="topbar">
      <div className="crumbs">
        {isInbox ? (
          <>
            <span>Gestión de auditoría</span><span className="div">/</span><span className="cur">{screenLabels[activeScreen]}</span>
          </>
        ) : (
          <>
            <span>Configuración</span><span className="div">/</span><span>App Builder</span><span className="div">/</span><span className="cur">{screenLabels[activeScreen]}</span>
          </>
        )}
      </div>
      <div className="top-actions">
        <span className="env">Borrador · v4</span>
        <button className="btn" type="button">Vista previa</button>
        <button className="btn primary" type="button">Publicar</button>
      </div>
    </div>
  );
}

function WorkflowScreen({ activeTab, onChangeTab, showAi, onShowAi }: { activeTab: WorkflowTab; onChangeTab: (tab: WorkflowTab) => void; showAi: boolean; onShowAi: (show: boolean) => void }) {
  return (
    <section className="screen active">
      <div className="page-head">
        <h1>Ciclo de vida del hallazgo</h1>
        <p className="desc">Define los estados por los que pasa un hallazgo, quién puede moverlo entre ellos y qué reglas se aplican en cada paso.</p>
        <div className="subtabs">
          <TabButton active={activeTab === "flow"} onClick={() => onChangeTab("flow")}>Estados y transiciones</TabButton>
          <TabButton active={activeTab === "rules"} onClick={() => onChangeTab("rules")}>Reglas</TabButton>
          <TabButton active={activeTab === "notifications"} onClick={() => onChangeTab("notifications")}>Notificaciones</TabButton>
          <TabButton active={activeTab === "history"} onClick={() => onChangeTab("history")}>Historial de versiones</TabButton>
        </div>
      </div>
      {activeTab === "flow" && <WorkflowFlowPanel showAi={showAi} onShowAi={onShowAi} />}
      {activeTab === "rules" && <SimpleRulesPanel />}
      {activeTab === "notifications" && <NotificationsPanel />}
      {activeTab === "history" && <HistoryPanel />}
    </section>
  );
}

function WorkflowFlowPanel({ showAi, onShowAi }: { showAi: boolean; onShowAi: (show: boolean) => void }) {
  return (
    <div className="panel active">
      <div className="wf-body">
        <div className="wf-canvas-area">
          <div className="canvas-banner" style={{ marginTop: 16 }}>
            <strong>!</strong>
            El asistente detectó 3 inconsistencias y 2 relaciones sugeridas en este flujo.
            <button className="lbtn" onClick={() => onShowAi(true)} type="button">Revisar</button>
          </div>
          <div className="canvas">
            <div className="canvas-tools"><button type="button">−</button><button type="button">100%</button><button type="button">+</button></div>
            <WireMap />
            <WorkflowNode kind="Inicial" name="Borrador" color="#9CA3AF" left={22} top={20} />
            <WorkflowNode kind="En proceso" name="En revisión" color="var(--amber)" left={222} top={20} />
            <WorkflowNode kind="Aprobación" name="Validación jefatura" color="var(--accent)" left={422} top={20} />
            <div className="auto-tag" style={{ left: 422, top: 88 }}><span className="d" /> Severidad sugerida</div>
            <WorkflowNode selected kind="Aprobación" name="Validación dirección" color="var(--accent)" left={622} top={20} />
            <WorkflowNode kind="Final" name="Cerrado" color="var(--green)" left={822} top={20} />
            <WorkflowNode kind="Retorno" name="Rechazado" color="var(--red)" left={622} top={170} />
            <div className="warn-dot" style={{ left: 766, top: 164 }} title="Sin salida configurada">!</div>
            <div className="warn-dot" style={{ left: 766, top: 14 }} title="Transición sin rol asignado">!</div>
            <div className="ghost-node" style={{ left: 422, top: 170 }}><div className="kind">Sugerido</div><div className="name">Aceptación de riesgo</div></div>
          </div>
        </div>
        <Inspector showAi={showAi} onShowAi={onShowAi} />
      </div>
    </div>
  );
}

function WireMap() {
  return (
    <svg className="wires" width="1010" height="340" viewBox="0 0 1010 340">
      <defs>
        <marker id="a-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1.5 1.5L9 5L1.5 8.5" fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <marker id="a-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1.5 1.5L9 5L1.5 8.5" fill="none" stroke="#1B4B8F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <marker id="a-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1.5 1.5L9 5L1.5 8.5" fill="none" stroke="#B98080" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <marker id="a-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1.5 1.5L9 5L1.5 8.5" fill="none" stroke="#B9CDE6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker>
      </defs>
      <path d="M174 50 L214 50" markerEnd="url(#a-g)" /><text x="194" y="42" textAnchor="middle">enviar</text>
      <path d="M374 50 L414 50" markerEnd="url(#a-g)" /><text x="394" y="42" textAnchor="middle">revisar</text>
      <path className="on" d="M574 50 L614 50" markerEnd="url(#a-b)" /><text x="594" y="42" textAnchor="middle" style={{ fill: "#1B4B8F", fontWeight: 500 }}>aprobar</text>
      <path d="M774 50 L814 50" markerEnd="url(#a-g)" /><text x="794" y="42" textAnchor="middle">cerrar</text>
      <path className="no" d="M690 82 L690 168" markerEnd="url(#a-r)" /><text className="no" x="698" y="128">rechazar</text>
      <path className="no" d="M614 198 L450 198 L450 82" markerEnd="url(#a-r)" /><text className="no" x="532" y="192" textAnchor="middle">devolver a revisión</text>
      <path d="M498 82 L498 168" stroke="#B9CDE6" strokeDasharray="5 4" markerEnd="url(#a-s)" /><text x="506" y="128" style={{ fill: "#1B4B8F" }}>sugerida</text>
    </svg>
  );
}

function WorkflowNode({ kind, name, color, left, top, selected = false }: { kind: string; name: string; color: string; left: number; top: number; selected?: boolean }) {
  return <div className={`node${selected ? " sel" : ""}`} style={{ left, top }}><div className="stripe" style={{ background: color }} /><div className="kind">{kind}</div><div className="name">{name}</div></div>;
}

function Inspector({ showAi, onShowAi }: { showAi: boolean; onShowAi: (show: boolean) => void }) {
  return (
    <aside className="inspector">
      <div className="insp-switch">
        <button className={!showAi ? "on" : ""} onClick={() => onShowAi(false)} type="button">Configuración</button>
        <button className={showAi ? "on" : ""} onClick={() => onShowAi(true)} type="button">Asistente de diseño</button>
      </div>
      {!showAi ? <InspectorConfig /> : <InspectorAi />}
    </aside>
  );
}

function InspectorConfig() {
  return (
    <div>
      <div className="insp-head"><div className="eyebrow">Transición seleccionada</div><h3>Validación jefatura → Validación dirección</h3></div>
      <div className="insp-sec"><div className="t">Permisos</div><Field label="Rol que puede ejecutarla" value="Jefe de Auditoría" /><Field label="Segregación de funciones" value="No puede aprobar su propia auditoría" /></div>
      <div className="insp-sec"><div className="t">Condiciones previas</div>{["Tiene al menos una evidencia adjunta", "Riesgo residual calculado", "severidad >= Alto requiere plan de acción"].map((condition) => <div className="cond" key={condition}><span className="cbx on" /><span>{condition}</span></div>)}<div className="cond"><span className="cbx" /><span>Comentario del revisor obligatorio</span></div></div>
      <div className="insp-sec"><div className="t">Asistencia automática</div><SwitchRow title="Sugerir severidad" description="Propone un nivel a partir del control, la evidencia y hallazgos históricos similares." /><div style={{ height: 12 }} /><SwitchRow title="Sugerir aprobador" description="Recomienda al responsable según matriz de roles y área auditada." /></div>
    </div>
  );
}

function InspectorAi() {
  return (
    <div className="ai-pane on">
      <div className="insp-head"><div className="eyebrow">Asistente de diseño</div><h3>Mejoras sugeridas</h3></div>
      <div className="insp-sec"><div className="prompt-box"><span className="ph">Describe una regla o cambio para este flujo...</span></div><div className="ai-hint">El asistente revisa permisos, salidas faltantes y consistencia entre estados.</div></div>
      <Suggestion title="Transición sin rol asignado" body="La transición aprobar no tiene un rol alterno para ausencia del jefe de auditoría." />
      <Suggestion title="Agregar aceptación de riesgo" body="Detecté casos históricos donde dirección acepta riesgo sin plan de acción." idea />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="fld"><label>{label}</label><div className="v">{value} <span className="car">▾</span></div></div>;
}

function SwitchRow({ title, description }: { title: string; description: string }) {
  const [enabled, setEnabled] = useState(true);
  return <div className="switch-row"><div><div className="st">{title}</div><div className="ss">{description}</div></div><button className={`sw${enabled ? " on" : ""}`} onClick={() => setEnabled(!enabled)} type="button" aria-label={title} /></div>;
}

function Suggestion({ title, body, idea = false }: { title: string; body: string; idea?: boolean }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="sugg" style={accepted ? { opacity: 0.4, pointerEvents: "none" } : undefined}>
      <div className="sh"><span className={`sicon ${idea ? "si-idea" : "si-warn"}`}>{idea ? "+" : "!"}</span><div className="stitle">{title}</div><span className="conf">Alta</span></div>
      <div className="sbody">{body}</div>
      <div className="sacts"><button className="sbtn apply" onClick={() => setAccepted(true)} type="button">Aplicar</button><button className="sbtn" type="button">Ignorar</button></div>
    </div>
  );
}

function DesignerScreen({ activeTab, onChangeTab }: { activeTab: DesignerTab; onChangeTab: (tab: DesignerTab) => void }) {
  return (
    <section className="screen active">
      <div className="page-head">
        <h1>Designer del formulario</h1>
        <p className="desc">Configura los campos que capturan los auditores, sus permisos por rol y las validaciones del formulario.</p>
        <div className="subtabs">
          <TabButton active={activeTab === "fields"} onClick={() => onChangeTab("fields")}>Campos</TabButton>
          <TabButton active={activeTab === "permissions"} onClick={() => onChangeTab("permissions")}>Permisos</TabButton>
          <TabButton active={activeTab === "validations"} onClick={() => onChangeTab("validations")}>Validaciones</TabButton>
          <TabButton active={activeTab === "history"} onClick={() => onChangeTab("history")}>Historial de versiones</TabButton>
        </div>
      </div>
      {activeTab === "fields" && <FieldsPanel />}
      {activeTab === "permissions" && <PermissionsPanel />}
      {activeTab === "validations" && <ValidationsPanel />}
      {activeTab === "history" && <HistoryPanel />}
    </section>
  );
}

function FieldsPanel() {
  return <ContentTable title="Campos disponibles para el registro y seguimiento de hallazgos." button="Nuevo campo" headers={["Campo", "Tipo", "Estado", ""]} rows={[["Título del hallazgo", "Texto corto", "Obligatorio", "Editar"], ["Descripción", "Texto largo", "Obligatorio", "Editar"], ["Control asociado", "Catálogo", "Obligatorio", "Editar"], ["Riesgo residual", "Calculado", "Automático", "Editar"], ["Fecha compromiso", "Fecha", "Obligatorio", "Editar"]]} />;
}

function PermissionsPanel() {
  return (
    <div className="panel active"><div className="content-area"><div className="area-head"><div className="txt">Matriz de permisos por rol para cada campo del formulario.</div></div><table className="tbl matrix"><thead><tr><th>Campo</th><th className="rot">Auditor</th><th className="rot">Jefatura</th><th className="rot">Dirección</th><th className="rot">Área auditada</th></tr></thead><tbody>{["Título del hallazgo", "Control asociado", "Riesgo residual", "Notas internas"].map((field, index) => <tr key={field}><td>{field}</td><td className="c"><Permission initial="p-edit" /></td><td className="c"><Permission initial={index === 3 ? "p-read" : "p-edit"} /></td><td className="c"><Permission initial="p-read" /></td><td className="c"><Permission initial={index === 3 ? "p-hide" : "p-read"} /></td></tr>)}</tbody></table></div></div>
  );
}

function Permission({ initial }: { initial: "p-edit" | "p-read" | "p-hide" }) {
  const options = ["p-edit", "p-read", "p-hide"] as const;
  const labels = { "p-edit": "Edición", "p-read": "Lectura", "p-hide": "Oculto" };
  const [value, setValue] = useState(initial);
  const next = options[(options.indexOf(value) + 1) % options.length];
  return <button className={`perm ${value}`} onClick={() => setValue(next)} type="button">{labels[value]}</button>;
}

function ValidationsPanel() {
  return <ContentTable title="Reglas de captura que se evalúan al guardar el formulario." button="Nueva validación" headers={["Campo", "Condición", "Mensaje al usuario", "Activa", ""]} rows={[["Título del hallazgo", "longitud <= 120", "El título no puede exceder 120 caracteres.", "Sí", "Editar"], ["Control asociado", "existe en catálogo de controles", "Selecciona un control vigente del catálogo.", "Sí", "Editar"], ["Fecha compromiso", "fecha >= hoy", "La fecha compromiso no puede ser anterior a hoy.", "Sí", "Editar"], ["Riesgo residual", "si editado manualmente -> justificación no vacía", "Explica por qué modificaste el riesgo calculado.", "Sí", "Editar"]]} />;
}

function SimpleRulesPanel() {
  return <ContentTable title="Reglas que deciden cuándo un hallazgo puede avanzar dentro del flujo." button="Nueva regla" headers={["Regla", "Condición", "Acción", "Estado"]} rows={[["Evidencia requerida", "Antes de validar jefatura", "Bloquear avance", "Activa"], ["Plan obligatorio", "Severidad alta", "Solicitar plan de acción", "Activa"], ["Comentario de rechazo", "Al rechazar", "Pedir comentario", "Activa"]]} />;
}

function NotificationsPanel() {
  return <ContentTable title="Avisos automáticos para responsables, aprobadores y áreas auditadas." button="Nueva notificación" headers={["Evento", "Destinatario", "Canal", "Estado"]} rows={[["Hallazgo enviado", "Jefe de Auditoría", "Email", "Activa"], ["Plan vencido", "Responsable del plan", "Email + bandeja", "Activa"], ["Hallazgo cerrado", "Área auditada", "Bandeja", "Activa"]]} />;
}

function ContentTable({ title, button, headers, rows }: { title: string; button?: string; headers: string[]; rows: string[][] }) {
  return <div className="panel active"><div className="content-area"><div className="area-head"><div className="txt">{title}</div>{button && <button className="btn primary" type="button">{button}</button>}</div><DataTable headers={headers} rows={rows} /></div></div>;
}

function HistoryPanel() {
  return (
    <div className="panel active"><div className="content-area"><div className="area-head"><div className="txt">Cambios publicados. Los hallazgos ya registrados conservan la estructura con la que fueron creados.</div><button className="btn" type="button">Comparar versiones</button></div><div style={{ border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface)", padding: "0 16px" }}><Version version="v6" date="En edición" status="Borrador" author="Alicia Alemán" items={["Se agregó el campo Riesgo residual", "Se ocultó Notas internas para el rol Área auditada"]} /><Version version="v5" date="10 ago 2026" status="Vigente" author="Alicia Alemán" items={["Se hizo obligatorio el campo Control asociado", "Se agregó la validación de 90 días para severidad alta"]} /><Version version="v4" date="28 jun 2026" status="Archivada" author="Equipo TI Auditoría" items={["Se reorganizaron los campos en tres secciones", "Se amplió el límite de adjuntos a 1 GB por archivo"]} /></div></div></div>
  );
}

function Version({ version, date, status, author, items }: { version: string; date: string; status: string; author: string; items: string[] }) {
  return <div className="ver"><div className="rail"><div className="vnum">{version}</div><div className="vdate">{date}</div></div><div className="body"><div className="vtop"><span className={`st-badge ${status === "Vigente" ? "b-green" : status === "Archivada" ? "b-gray" : "b-amber"}`}>{status}</span><span className="vwho">{author}</span><div className="acts"><button className="lbtn" type="button">Ver</button></div></div><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div></div>;
}

function InboxScreen() {
  const rows = [["HZ-2041", "Accesos privilegiados sin revocar en SAP", "FEMSA Servicios · Auditoría TI Q2", "En revisión", "Alta", "2 días"], ["HZ-2038", "Diferencias en conciliación de inventarios", "División Bebidas · Auditoría operativa", "Validación jefatura", "Media", "9 días"], ["HZ-2033", "Segregación de funciones en pagos a proveedores", "Tesorería corporativa · Auditoría financiera", "Validación dirección", "Alta", "1 día"], ["HZ-2029", "Retención de datos personales fuera de política", "FL Colombia · Auditoría de cumplimiento", "Cerrado", "Baja", "-"]];

  return (
    <section className="screen active"><div className="page-head"><h1>Mi bandeja</h1><p className="desc">Hallazgos y aprobaciones que esperan tu acción, ordenados por antigüedad.</p><div className="subtabs"><button className="subtab on" type="button">Pendientes <span style={{ color: "var(--muted-2)" }}>7</span></button><button className="subtab" type="button">Delegados</button><button className="subtab" type="button">Completados</button></div></div><div className="inbox-area"><div className="filters"><span className="fchip on">Todos</span><span className="fchip">Requieren aprobación</span><span className="fchip">Vencidos</span><span className="fchip">Severidad alta</span><span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>Mostrando 4 de 7</span></div><table className="tbl"><thead><tr><th style={{ width: 88 }}>ID</th><th>Hallazgo</th><th style={{ width: 150 }}>Estado</th><th style={{ width: 140 }}>Severidad</th><th style={{ width: 110 }}>Esperando</th><th style={{ width: 70 }} /></tr></thead><tbody>{rows.map(([id, title, subtitle, status, severity, waiting]) => <tr key={id}><td className="id-cell">{id}</td><td>{title}<div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div></td><td><span className={`st-badge ${status === "Cerrado" ? "b-green" : status === "En revisión" ? "b-amber" : "b-blue"}`}>{status}</span></td><td><span className="sev"><span className="bar" style={{ background: severity === "Alta" ? "var(--red)" : severity === "Media" ? "var(--amber)" : "var(--muted-2)" }} />{severity}</span></td><td className={`aging${waiting === "9 días" ? " late" : ""}`}>{waiting}</td><td><span className="link">{status === "Cerrado" ? "Ver" : "Abrir"}</span></td></tr>)}</tbody></table></div></section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="tbl"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.join("|")}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{index === row.length - 1 && cell === "Editar" ? <span className="link">{cell}</span> : cell}</td>)}</tr>)}</tbody></table>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`subtab${active ? " on" : ""}`} onClick={onClick} type="button">{children}</button>;
}
