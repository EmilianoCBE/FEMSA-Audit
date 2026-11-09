import { useState, type CSSProperties } from "react";
import type { RiskWithControlsDetail } from "../types/controlEvaluation.types";

type Evaluation = NonNullable<RiskWithControlsDetail["controls"][number]["latestEvaluation"]>;

type MatrixCell = {
  count: number;
  result: string | null;
  mixed: boolean;
};

const LEVELS = ["Menor", "Bajo", "Moderado", "Alto", "Crítico"];

const PROBABILITIES = ["Inminente", "Altamente probable", "Probable", "No probable", "Remota"];

const IMPACTS = ["Menor", "Bajo", "Moderado", "Alto", "Crítico"];

const CONTROL_RATINGS = ["Inicial", "Funcional", "Definido", "Gestionado", "Optimizado"];

const INHERENT_ROWS = ["Crítico", "Alto", "Moderado", "Bajo", "Menor"];

const CONTROL_COLUMNS = ["Optimizado", "Gestionado", "Definido", "Funcional", "Inicial"];

const LEVEL_VALUES: Record<string, number> = {
  Menor: 1,
  Bajo: 2,
  Moderado: 3,
  Alto: 4,
  Crítico: 5,
};

const LEVEL_COLORS: Record<string, string> = {
  Menor: "#DCFCE7",
  Bajo: "#BBF7D0",
  Moderado: "#FEF3C7",
  Alto: "#FED7AA",
  Crítico: "#FECACA",
};

const LEVEL_TEXT: Record<string, string> = {
  Menor: "#166534",
  Bajo: "#166534",
  Moderado: "#92400E",
  Alto: "#9A3412",
  Crítico: "#991B1B",
};

const CONTROL_COLORS: Record<string, string> = {
  Inicial: "#FECACA",
  Funcional: "#FED7AA",
  Definido: "#FEF3C7",
  Gestionado: "#BBF7D0",
  Optimizado: "#DCFCE7",
};

const CONTROL_TEXT: Record<string, string> = {
  Inicial: "#991B1B",
  Funcional: "#9A3412",
  Definido: "#92400E",
  Gestionado: "#166534",
  Optimizado: "#166534",
};

const cardStyle: CSSProperties = {
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 14,
  padding: 20,
  background: "var(--card, #ffffff)",
  minWidth: 0,
};

const mutedStyle: CSSProperties = {
  color: "var(--muted-foreground, #6b7280)",
  fontSize: 13,
};

function getBackground(level: string | null, kind: "risk" | "control") {
  if (!level) return "#F3F4F6";

  return kind === "control" ? (CONTROL_COLORS[level] ?? "#F3F4F6") : (LEVEL_COLORS[level] ?? "#F3F4F6");
}

function getForeground(level: string | null, kind: "risk" | "control") {
  if (!level) return "#6B7280";

  return kind === "control" ? (CONTROL_TEXT[level] ?? "#6B7280") : (LEVEL_TEXT[level] ?? "#6B7280");
}

function buildCell(
  evaluations: Evaluation[],
  row: string,
  column: string,
  rowField: keyof Evaluation,
  columnField: keyof Evaluation,
  resultField: keyof Evaluation,
): MatrixCell {
  const matches = evaluations.filter(
    (evaluation) => evaluation[rowField] === row && evaluation[columnField] === column,
  );

  const results = [
    ...new Set(
      matches
        .map((evaluation) => evaluation[resultField])
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  return {
    count: matches.length,
    result: results.length === 1 ? results[0] : null,
    mixed: results.length > 1,
  };
}

type HeatmapProps = {
  title: string;
  description: string;
  rows: string[];
  columns: string[];
  rowLabel: string;
  getCell: (row: string, column: string) => MatrixCell;
  kind: "risk" | "control";
};

function Heatmap({ title, description, rows, columns, rowLabel, getCell, kind }: HeatmapProps) {
  return (
    <section style={cardStyle}>
      <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{title}</h3>
      <p style={{ ...mutedStyle, marginTop: 0 }}>{description}</p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 540,
            borderCollapse: "separate",
            borderSpacing: 4,
            textAlign: "center",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: 6 }}>{rowLabel}</th>
              {columns.map((column) => (
                <th key={column} style={{ padding: 6 }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <th style={{ padding: 6, textAlign: "right" }}>{row}</th>

                {columns.map((column) => {
                  const cell = getCell(row, column);
                  const background = getBackground(cell.result, kind);
                  const foreground = getForeground(cell.result, kind);

                  return (
                    <td
                      key={`${row}-${column}`}
                      title={
                        cell.count
                          ? `${row} / ${column}: ${cell.count} controles. Resultado: ${cell.result ?? "Mixto"}`
                          : `${row} / ${column}: sin controles evaluados`
                      }
                      style={{
                        background: cell.count > 0 ? background : "#F3F4F6",
                        color: cell.count > 0 ? foreground : "#9CA3AF",
                        borderRadius: 7,
                        padding: "10px 5px",
                        minWidth: 75,
                        border: cell.mixed ? "2px dashed #6B7280" : "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{cell.count || "—"}</div>
                      <div style={{ fontSize: 10, marginTop: 3 }}>
                        {cell.count ? (cell.mixed ? "Mixto" : cell.result) : "Sin datos"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ ...mutedStyle, marginBottom: 0 }}>
        Cada celda muestra cuántos controles evaluados tienen esa combinación. El color corresponde al resultado
        calculado por la matriz oficial. Las celdas sin datos permanecen neutras.
      </p>
    </section>
  );
}

type Props = {
  detail: RiskWithControlsDetail;
};

export default function RiskResidualAnalysis({ detail }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const evaluated = detail.controls
    .map((control) => control.latestEvaluation)
    .filter((evaluation): evaluation is Evaluation => evaluation !== null);

  const pending = detail.controls.length - evaluated.length;

  const counts = LEVELS.map((level) => ({
    level,
    count: evaluated.filter((evaluation) => evaluation.vulnerability === level).length,
  }));

  const total = evaluated.length;

  const sorted = evaluated
    .map((evaluation) => evaluation.vulnerability)
    .filter((level) => LEVEL_VALUES[level] !== undefined)
    .sort((a, b) => LEVEL_VALUES[a] - LEVEL_VALUES[b]);

  const isEven = sorted.length > 0 && sorted.length % 2 === 0;

  const medianIndexes =
    sorted.length === 0 ? [] : isEven ? [sorted.length / 2 - 1, sorted.length / 2] : [Math.floor(sorted.length / 2)];

  const medianItems = medianIndexes.map((index) => ({
    position: index + 1,
    level: sorted[index],
    value: LEVEL_VALUES[sorted[index]],
  }));

  const medianRaw =
    medianItems.length === 2 ? (medianItems[0].value + medianItems[1].value) / 2 : (medianItems[0]?.value ?? null);

  const medianRounded = medianRaw === null ? null : Math.ceil(medianRaw);

  const residual = detail.residualRisk;

  const probabilityImpactCell = (row: string, column: string) =>
    buildCell(evaluated, row, column, "probability", "impact", "inherentLevel");

  const designEffectivenessCell = (row: string, column: string) =>
    buildCell(evaluated, row, column, "designRating", "effectivenessRating", "controlLevel");

  const vulnerabilityCell = (row: string, column: string) =>
    buildCell(evaluated, row, column, "inherentLevel", "controlLevel", "vulnerability");

  return (
    <section
      style={{
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 14,
        background: "var(--card, #ffffff)",
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      {/* ENCABEZADO DESPLEGABLE */}
      <button
        type="button"
        onClick={() => setIsExpanded((previous) => !previous)}
        aria-expanded={isExpanded}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: 20,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 19 }}>Análisis del riesgo residual</h2>
          <p style={{ ...mutedStyle, marginBottom: 0 }}>
            Consulta las matrices oficiales, la distribución de vulnerabilidades y la metodología utilizada para
            calcular el riesgo residual.
          </p>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "9px 13px",
            borderRadius: 8,
            border: "1px solid var(--border, #e5e7eb)",
            color: "var(--primary, #2563eb)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {isExpanded ? "Ocultar análisis −" : "Ver análisis +"}
        </span>
      </button>

      {/* CONTENIDO DESPLEGABLE */}
      {isExpanded && (
        <div
          style={{
            display: "grid",
            gap: 20,
            padding: 20,
            borderTop: "1px solid var(--border, #e5e7eb)",
          }}
        >
          {total === 0 ? (
            <section style={cardStyle}>
              <p style={mutedStyle}>
                Este riesgo todavía no tiene controles evaluados. No es posible calcular la mediana.
              </p>
            </section>
          ) : (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Análisis y justificación del riesgo residual</h2>
                <p style={{ ...mutedStyle, marginTop: 5 }}>
                  {detail.risk.trackingId} · Distribución de las últimas evaluaciones de sus controles.
                </p>
              </div>

              <section style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ ...mutedStyle, margin: 0 }}>Riesgo residual</p>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                        color: getForeground(residual?.level ?? null, "risk"),
                        marginTop: 4,
                      }}
                    >
                      {residual?.level ?? "Sin calcular"}
                    </div>
                    <p style={{ ...mutedStyle, margin: "4px 0 0" }}>Resultado de la mediana de vulnerabilidades</p>
                  </div>

                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 25, fontWeight: 800 }}>{total}</div>
                      <div style={mutedStyle}>Controles evaluados</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 25, fontWeight: 800 }}>{pending}</div>
                      <div style={mutedStyle}>Pendientes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 25, fontWeight: 800 }}>{detail.controls.length}</div>
                      <div style={mutedStyle}>Controles totales</div>
                    </div>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 5px", fontSize: 17 }}>Distribución de vulnerabilidades</h3>
                <p style={{ ...mutedStyle, marginTop: 0 }}>
                  Cantidad y porcentaje de controles por nivel de vulnerabilidad.
                </p>

                <div
                  style={{
                    display: "flex",
                    height: 22,
                    overflow: "hidden",
                    borderRadius: 8,
                    gap: 2,
                  }}
                >
                  {counts.map(({ level, count }) =>
                    count > 0 ? (
                      <div
                        key={level}
                        title={`${level}: ${count} controles`}
                        style={{
                          width: `${(count / total) * 100}%`,
                          background: LEVEL_COLORS[level],
                        }}
                      />
                    ) : null,
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  {counts.map(({ level, count }) => (
                    <div
                      key={level}
                      style={{
                        display: "flex",
                        gap: 9,
                        alignItems: "center",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: LEVEL_COLORS[level],
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{level}</div>
                        <div style={mutedStyle}>
                          {count} controles · {((count / total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ margin: "0 0 5px", fontSize: 17 }}>¿Cómo se obtiene la mediana?</h3>
                <p style={mutedStyle}>
                  Las vulnerabilidades se convierten a su valor ordinal, se ordenan de menor a mayor y se identifica la
                  posición central.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 10,
                    margin: "18px 0",
                  }}
                >
                  {counts.map(({ level, count }) => {
                    const firstPosition =
                      count > 0 ? sorted.findIndex((item) => LEVEL_VALUES[item] === LEVEL_VALUES[level]) + 1 : null;
                    const lastPosition = firstPosition === null ? null : firstPosition + count - 1;

                    return (
                      <div
                        key={level}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: LEVEL_COLORS[level],
                          color: LEVEL_TEXT[level],
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{level}</div>
                        <div style={{ fontSize: 12 }}>{count} controles</div>
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          {firstPosition === null ? "Sin posiciones" : `Posiciones ${firstPosition}–${lastPosition}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(11px, 1fr))",
                    gap: 5,
                    padding: 12,
                    background: "var(--muted, #f9fafb)",
                    borderRadius: 10,
                  }}
                >
                  {sorted.map((level, index) => {
                    const isMedian = medianIndexes.includes(index);

                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: cada punto es una posición fija de la lista ordenada.
                        key={`${level}-${index}`}
                        title={`Posición ${index + 1}: ${level}`}
                        style={{
                          aspectRatio: "1",
                          minWidth: 5,
                          borderRadius: "50%",
                          background: LEVEL_COLORS[level],
                          border: isMedian ? "3px solid #111827" : "1px solid rgba(0,0,0,0.12)",
                          transform: isMedian ? "scale(1.25)" : undefined,
                        }}
                      />
                    );
                  })}
                </div>

                <p style={{ ...mutedStyle, marginTop: 10 }}>
                  Cada punto representa un control evaluado. Los puntos con borde oscuro indican las posiciones
                  centrales utilizadas para la mediana.
                </p>

                <div
                  style={{
                    background: "var(--muted, #f9fafb)",
                    borderRadius: 10,
                    padding: 16,
                    marginTop: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Valores centrales</div>

                  {medianItems.map((item) => (
                    <div
                      key={item.position}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        margin: "6px 0",
                      }}
                    >
                      <span style={mutedStyle}>Posición {item.position}</span>
                      <strong>
                        {item.level} ({item.value})
                      </strong>
                    </div>
                  ))}

                  {isEven && medianRaw !== null && (
                    <p style={mutedStyle}>
                      Promedio de los dos valores centrales: {medianRaw}. Aplicando la regla FEMSA de redondeo hacia
                      arriba:
                      {medianRounded}.
                    </p>
                  )}

                  <div
                    style={{
                      borderTop: "1px solid var(--border, #e5e7eb)",
                      paddingTop: 12,
                      marginTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <strong>Resultado de la mediana</strong>
                    <strong
                      style={{
                        color: getForeground(residual?.level ?? null, "risk"),
                        fontSize: 20,
                      }}
                    >
                      {residual?.value ?? medianRounded} · {residual?.level ?? "—"}
                    </strong>
                  </div>

                  <p style={{ ...mutedStyle, marginBottom: 0 }}>
                    El riesgo residual mostrado corresponde al cálculo oficial del backend. La posición central de esta
                    sección permite explicar visualmente cómo se obtiene.
                  </p>
                </div>
              </section>

              <Heatmap
                title="Matriz de probabilidad e impacto"
                description="Distribución de los controles evaluados según su probabilidad e impacto. El color refleja el nivel inherente calculado."
                rows={PROBABILITIES}
                columns={IMPACTS}
                rowLabel="Probabilidad / Impacto"
                kind="risk"
                getCell={probabilityImpactCell}
              />

              <Heatmap
                title="Matriz de diseño y efectividad"
                description="Distribución de controles según la calificación de diseño y efectividad. El color refleja el nivel de control calculado."
                rows={CONTROL_RATINGS}
                columns={CONTROL_RATINGS}
                rowLabel="Diseño / Efectividad"
                kind="control"
                getCell={designEffectivenessCell}
              />

              <Heatmap
                title="Matriz de vulnerabilidad"
                description="Cruce entre riesgo inherente y nivel de control. El color representa la vulnerabilidad resultante."
                rows={INHERENT_ROWS}
                columns={CONTROL_COLUMNS}
                rowLabel="Riesgo inherente / Control"
                kind="risk"
                getCell={vulnerabilityCell}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
