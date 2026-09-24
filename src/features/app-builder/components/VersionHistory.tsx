export function HistoryPanel() {
  return (
    <div className="panel active">
      <div className="content-area">
        <div className="area-head">
          <div className="txt">
            Cambios publicados. Los hallazgos ya registrados conservan la estructura con la que fueron creados.
          </div>
          <button className="btn" type="button">Comparar versiones</button>
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface)", padding: "0 16px" }}>
          {/* TODO(US11 - Rafael Valdez): cargar versiones reales, cambios relevantes y restauración autorizada. */}
          {/* TODO(US12 - Leonel): conservar configuración por versión en casos abiertos y definir reglas de actualización. */}
          <Version version="v6" date="En edición" status="Borrador" author="Alicia Alemán" items={["Se agregó el campo Riesgo residual", "Se ocultó Notas internas para el rol Área auditada"]} />
          <Version version="v5" date="10 ago 2026" status="Vigente" author="Alicia Alemán" items={["Se hizo obligatorio el campo Control asociado", "Se agregó la validación de 90 días para severidad alta"]} />
          <Version version="v4" date="28 jun 2026" status="Archivada" author="Equipo TI Auditoría" items={["Se reorganizaron los campos en tres secciones", "Se amplió el límite de adjuntos a 1 GB por archivo"]} />
        </div>
      </div>
    </div>
  );
}

function Version({
  version,
  date,
  status,
  author,
  items,
}: {
  version: string;
  date: string;
  status: string;
  author: string;
  items: string[];
}) {
  return (
    <div className="ver">
      <div className="rail">
        <div className="vnum">{version}</div>
        <div className="vdate">{date}</div>
      </div>
      <div className="body">
        <div className="vtop">
          <span className={`st-badge ${status === "Vigente" ? "b-green" : status === "Archivada" ? "b-gray" : "b-amber"}`}>{status}</span>
          <span className="vwho">{author}</span>
          <div className="acts"><button className="lbtn" type="button">Ver</button></div>
        </div>
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

