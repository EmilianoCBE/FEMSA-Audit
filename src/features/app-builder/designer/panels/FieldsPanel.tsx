import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, QueryState, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { FIELD_REQUIREMENT_LABELS, FIELD_TYPE_LABELS } from "../lib/formFields";
import { designerService } from "../services/designerService";
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
  const query = useQuery(designerService.listFields);

  return (
    <ContentArea>
      <SectionToolbar
        description="Campos disponibles para el registro y seguimiento de hallazgos."
        action={<Button variant="primary">Nuevo campo</Button>}
      />
      <QueryState query={query}>
        {(fields) => <DataTable columns={COLUMNS} rows={fields} getRowKey={(field) => field.id} />}
      </QueryState>
    </ContentArea>
  );
}
