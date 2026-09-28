import { Button, ContentArea, DataTable, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { formFieldsMock } from "../data/designer.mock";
import { FIELD_REQUIREMENT_LABELS, FIELD_TYPE_LABELS } from "../lib/formFields";
import type { FormField } from "../types";

const COLUMNS: readonly DataTableColumn<FormField>[] = [
  { id: "name", header: "Campo", render: (field) => field.name },
  { id: "type", header: "Tipo", render: (field) => FIELD_TYPE_LABELS[field.type] },
  { id: "requirement", header: "Estado", render: (field) => FIELD_REQUIREMENT_LABELS[field.requirement] },
  { id: "actions", render: () => <Button variant="link">Editar</Button> },
];

// TODO(US03 - Magda Colunga): implementar selección, drag & drop, posicionamiento y guardado de elementos en canvas.
// TODO(US07 - Karla Alessandra): agregar captura de probabilidad/impacto, cálculo y visualización del nivel de riesgo.
export function FieldsPanel() {
  return (
    <ContentArea>
      <SectionToolbar
        description="Campos disponibles para el registro y seguimiento de hallazgos."
        action={<Button variant="primary">Nuevo campo</Button>}
      />
      <DataTable columns={COLUMNS} rows={formFieldsMock} getRowKey={(field) => field.id} />
    </ContentArea>
  );
}
