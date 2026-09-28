import type { AppVersion } from "../types";

// TODO(US11 - Rafael Valdez): cargar versiones reales, cambios relevantes y restauración autorizada.
export const versionsMock: readonly AppVersion[] = [
  {
    id: "v6",
    version: "v6",
    date: "En edición",
    status: "draft",
    author: "Alicia Alemán",
    changes: ["Se agregó el campo Riesgo residual", "Se ocultó Notas internas para el rol Área auditada"],
  },
  {
    id: "v5",
    version: "v5",
    date: "10 ago 2026",
    status: "current",
    author: "Alicia Alemán",
    changes: ["Se hizo obligatorio el campo Control asociado", "Se agregó la validación de 90 días para severidad alta"],
  },
  {
    id: "v4",
    version: "v4",
    date: "28 jun 2026",
    status: "archived",
    author: "Equipo TI Auditoría",
    changes: ["Se reorganizaron los campos en tres secciones", "Se amplió el límite de adjuntos a 1 GB por archivo"],
  },
];
