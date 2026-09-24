import type { Screen } from "../types";

const screenLabels: Record<Screen, string> = {
  workflow: "Workflow",
  designer: "Designer",
  inbox: "Mi bandeja",
};

export function Topbar({ activeScreen }: { activeScreen: Screen }) {
  const isInbox = activeScreen === "inbox";

  return (
    <div className="topbar">
      <div className="crumbs">
        {isInbox ? (
          <>
            <span>Gestión de auditoría</span>
            <span className="div">/</span>
            <span className="cur">{screenLabels[activeScreen]}</span>
          </>
        ) : (
          <>
            <span>Configuración</span>
            <span className="div">/</span>
            <span>App Builder</span>
            <span className="div">/</span>
            <span className="cur">{screenLabels[activeScreen]}</span>
          </>
        )}
      </div>
      <div className="top-actions">
        <span className="env">Borrador · v4</span>
        {/* TODO(US08 - Leonel): abrir preview responsivo con modos Desktop, Tablet y Mobile. */}
        <button className="btn" type="button">Vista previa</button>
        {/* TODO(US10 - Juan Aguilar): guardar/reabrir Draft y evitar que aparezca como aplicación publicada. */}
        <button className="btn primary" type="button">Publicar</button>
      </div>
    </div>
  );
}

