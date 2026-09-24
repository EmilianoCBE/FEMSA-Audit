import { useState } from "react";
import { ContentTable } from "../components/ContentTable";
import { TabButton } from "../components/TabButton";
import { HistoryPanel } from "../components/VersionHistory";
import type { WorkflowTab } from "../types";

export function WorkflowScreen({
  activeTab,
  onChangeTab,
  showAi,
  onShowAi,
}: {
  activeTab: WorkflowTab;
  onChangeTab: (tab: WorkflowTab) => void;
  showAi: boolean;
  onShowAi: (show: boolean) => void;
}) {
  return (
    <section className="screen active">
      <div className="page-head">
        <h1>Ciclo de vida del hallazgo</h1>
        <p className="desc">
          Define los estados por los que pasa un hallazgo, quién puede moverlo entre ellos y qué reglas se aplican en cada paso.
        </p>
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

function WorkflowFlowPanel({
  showAi,
  onShowAi,
}: {
  showAi: boolean;
  onShowAi: (show: boolean) => void;
}) {
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
            <div className="canvas-tools">
              <button type="button">−</button>
              <button type="button">100%</button>
              <button type="button">+</button>
            </div>
            {/* TODO(US04 - Rafael Valdez): hacer seleccionables las actividades y navegar predecesoras/sucesoras en menos de 3 segundos. */}
            {/* TODO(US05 - Juan Aguilar): permitir minimizar/expandir el workflow integrado sin salir del Designer. */}
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
            <div className="ghost-node" style={{ left: 422, top: 170 }}>
              <div className="kind">Sugerido</div>
              <div className="name">Aceptación de riesgo</div>
            </div>
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

function WorkflowNode({
  kind,
  name,
  color,
  left,
  top,
  selected = false,
}: {
  kind: string;
  name: string;
  color: string;
  left: number;
  top: number;
  selected?: boolean;
}) {
  return (
    <div className={`node${selected ? " sel" : ""}`} style={{ left, top }}>
      <div className="stripe" style={{ background: color }} />
      <div className="kind">{kind}</div>
      <div className="name">{name}</div>
    </div>
  );
}

function Inspector({
  showAi,
  onShowAi,
}: {
  showAi: boolean;
  onShowAi: (show: boolean) => void;
}) {
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
      <div className="insp-sec">
        <div className="t">Condiciones previas</div>
        {["Tiene al menos una evidencia adjunta", "Riesgo residual calculado", "severidad >= Alto requiere plan de acción"].map((condition) => <div className="cond" key={condition}><span className="cbx on" /><span>{condition}</span></div>)}
        <div className="cond"><span className="cbx" /><span>Comentario del revisor obligatorio</span></div>
      </div>
      <div className="insp-sec">
        <div className="t">Asistencia automática</div>
        <SwitchRow title="Sugerir severidad" description="Propone un nivel a partir del control, la evidencia y hallazgos históricos similares." />
        <div style={{ height: 12 }} />
        <SwitchRow title="Sugerir aprobador" description="Recomienda al responsable según matriz de roles y área auditada." />
      </div>
    </div>
  );
}

function InspectorAi() {
  return (
    <div className="ai-pane on">
      <div className="insp-head"><div className="eyebrow">Asistente de diseño</div><h3>Mejoras sugeridas</h3></div>
      <div className="insp-sec">
        <div className="prompt-box"><span className="ph">Describe una regla o cambio para este flujo...</span></div>
        <div className="ai-hint">El asistente revisa permisos, salidas faltantes y consistencia entre estados.</div>
      </div>
      {/* TODO(US15 - Emiliano Carrizales): analizar contexto y generar recomendaciones explicadas. */}
      {/* TODO(US16 - Emiliano Carrizales): detectar inconsistencias y explicar el motivo de cada alerta. */}
      {/* TODO(US17 - Emiliano Carrizales): aceptar, rechazar o reemplazar recomendaciones sin aplicarlas automáticamente. */}
      {/* TODO(US18 - Karla Alessandra): manejar caída del servicio de IA manteniendo funciones manuales. */}
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

function SimpleRulesPanel() {
  return <ContentTable title="Reglas que deciden cuándo un hallazgo puede avanzar dentro del flujo." button="Nueva regla" headers={["Regla", "Condición", "Acción", "Estado"]} rows={[["Evidencia requerida", "Antes de validar jefatura", "Bloquear avance", "Activa"], ["Plan obligatorio", "Severidad alta", "Solicitar plan de acción", "Activa"], ["Comentario de rechazo", "Al rechazar", "Pedir comentario", "Activa"]]} />;
}

function NotificationsPanel() {
  return <ContentTable title="Avisos automáticos para responsables, aprobadores y áreas auditadas." button="Nueva notificación" headers={["Evento", "Destinatario", "Canal", "Estado"]} rows={[["Hallazgo enviado", "Jefe de Auditoría", "Email", "Activa"], ["Plan vencido", "Responsable del plan", "Email + bandeja", "Activa"], ["Hallazgo cerrado", "Área auditada", "Bandeja", "Activa"]]} />;
}

