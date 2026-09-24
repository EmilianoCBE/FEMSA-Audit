export function InboxScreen() {
  const rows = [
    ["HZ-2041", "Accesos privilegiados sin revocar en SAP", "FEMSA Servicios · Auditoría TI Q2", "En revisión", "Alta", "2 días"],
    ["HZ-2038", "Diferencias en conciliación de inventarios", "División Bebidas · Auditoría operativa", "Validación jefatura", "Media", "9 días"],
    ["HZ-2033", "Segregación de funciones en pagos a proveedores", "Tesorería corporativa · Auditoría financiera", "Validación dirección", "Alta", "1 día"],
    ["HZ-2029", "Retención de datos personales fuera de política", "FL Colombia · Auditoría de cumplimiento", "Cerrado", "Baja", "-"],
  ];

  return (
    <section className="screen active">
      <div className="page-head">
        <h1>Mi bandeja</h1>
        <p className="desc">Hallazgos y aprobaciones que esperan tu acción, ordenados por antigüedad.</p>
        <div className="subtabs">
          <button className="subtab on" type="button">Pendientes <span style={{ color: "var(--muted-2)" }}>7</span></button>
          <button className="subtab" type="button">Delegados</button>
          <button className="subtab" type="button">Completados</button>
        </div>
      </div>

      <div className="inbox-area">
        <div className="filters">
          <span className="fchip on">Todos</span>
          <span className="fchip">Requieren aprobación</span>
          <span className="fchip">Vencidos</span>
          <span className="fchip">Severidad alta</span>
          <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)" }}>Mostrando 4 de 7</span>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 88 }}>ID</th>
              <th>Hallazgo</th>
              <th style={{ width: 150 }}>Estado</th>
              <th style={{ width: 140 }}>Severidad</th>
              <th style={{ width: 110 }}>Esperando</th>
              <th style={{ width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, title, subtitle, status, severity, waiting]) => (
              <tr key={id}>
                <td className="id-cell">{id}</td>
                <td>{title}<div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div></td>
                <td><span className={`st-badge ${status === "Cerrado" ? "b-green" : status === "En revisión" ? "b-amber" : "b-blue"}`}>{status}</span></td>
                <td><span className="sev"><span className="bar" style={{ background: severity === "Alta" ? "var(--red)" : severity === "Media" ? "var(--amber)" : "var(--muted-2)" }} />{severity}</span></td>
                <td className={`aging${waiting === "9 días" ? " late" : ""}`}>{waiting}</td>
                <td><span className="link">{status === "Cerrado" ? "Ver" : "Abrir"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

