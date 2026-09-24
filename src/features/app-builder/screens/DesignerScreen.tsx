import { useState } from "react";
import { ContentTable } from "../components/ContentTable";
import { TabButton } from "../components/TabButton";
import { HistoryPanel } from "../components/VersionHistory";
import type { DesignerTab } from "../types";

export function DesignerScreen({
  activeTab,
  onChangeTab,
}: {
  activeTab: DesignerTab;
  onChangeTab: (tab: DesignerTab) => void;
}) {
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
  return (
    <>
      {/* TODO(US03 - Magda Colunga): implementar selección, drag & drop, posicionamiento y guardado de elementos en canvas. */}
      {/* TODO(US07 - Karla Alessandra): agregar captura de probabilidad/impacto, cálculo y visualización del nivel de riesgo. */}
      <ContentTable
        title="Campos disponibles para el registro y seguimiento de hallazgos."
        button="Nuevo campo"
        headers={["Campo", "Tipo", "Estado", ""]}
        rows={[
          ["Título del hallazgo", "Texto corto", "Obligatorio", "Editar"],
          ["Descripción", "Texto largo", "Obligatorio", "Editar"],
          ["Control asociado", "Catálogo", "Obligatorio", "Editar"],
          ["Riesgo residual", "Calculado", "Automático", "Editar"],
          ["Fecha compromiso", "Fecha", "Obligatorio", "Editar"],
        ]}
      />
    </>
  );
}

function PermissionsPanel() {
  return (
    <div className="panel active">
      <div className="content-area">
        <div className="area-head">
          <div className="txt">Matriz de permisos por rol para cada campo del formulario.</div>
        </div>
        {/* TODO(US13 - Magda Colunga): aplicar permisos predeterminados por rol y permitir habilitar/deshabilitar por módulo. */}
        {/* TODO(US14 - Leonel): determinar usuario/rol autenticado y restringir funcionalidades no autorizadas. */}
        <table className="tbl matrix">
          <thead>
            <tr>
              <th>Campo</th>
              <th className="rot">Auditor</th>
              <th className="rot">Jefatura</th>
              <th className="rot">Dirección</th>
              <th className="rot">Área auditada</th>
            </tr>
          </thead>
          <tbody>
            {["Título del hallazgo", "Control asociado", "Riesgo residual", "Notas internas"].map((field, index) => (
              <tr key={field}>
                <td>{field}</td>
                <td className="c"><Permission initial="p-edit" /></td>
                <td className="c"><Permission initial={index === 3 ? "p-read" : "p-edit"} /></td>
                <td className="c"><Permission initial="p-read" /></td>
                <td className="c"><Permission initial={index === 3 ? "p-hide" : "p-read"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Permission({ initial }: { initial: "p-edit" | "p-read" | "p-hide" }) {
  const options = ["p-edit", "p-read", "p-hide"] as const;
  const labels = { "p-edit": "Edición", "p-read": "Lectura", "p-hide": "Oculto" };
  const [value, setValue] = useState(initial);
  const next = options[(options.indexOf(value) + 1) % options.length];

  return (
    <button className={`perm ${value}`} onClick={() => setValue(next)} type="button">
      {labels[value]}
    </button>
  );
}

function ValidationsPanel() {
  return (
    <ContentTable
      title="Reglas de captura que se evalúan al guardar el formulario."
      button="Nueva validación"
      headers={["Campo", "Condición", "Mensaje al usuario", "Activa", ""]}
      rows={[
        ["Título del hallazgo", "longitud <= 120", "El título no puede exceder 120 caracteres.", "Sí", "Editar"],
        ["Control asociado", "existe en catálogo de controles", "Selecciona un control vigente del catálogo.", "Sí", "Editar"],
        ["Fecha compromiso", "fecha >= hoy", "La fecha compromiso no puede ser anterior a hoy.", "Sí", "Editar"],
        ["Riesgo residual", "si editado manualmente -> justificación no vacía", "Explica por qué modificaste el riesgo calculado.", "Sí", "Editar"],
      ]}
    />
  );
}

