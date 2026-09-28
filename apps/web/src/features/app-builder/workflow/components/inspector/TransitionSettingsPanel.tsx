import { Fragment } from "react";
import { useToggleRecord } from "@/shared/hooks/useToggleRecord";
import { Checkbox, InspectorHeader, InspectorSection, SelectField, SwitchField } from "@/shared/ui";
import type { TransitionSettings } from "../../types";

export function TransitionSettingsPanel({ settings }: { settings: TransitionSettings }) {
  const [preconditions, setPrecondition] = useToggleRecord(settings.preconditions);
  const [automations, setAutomation] = useToggleRecord(settings.automations);

  return (
    <div>
      <InspectorHeader eyebrow="Transición seleccionada" title={settings.title} />

      <InspectorSection title="Permisos">
        {settings.permissions.map((permission) => (
          <SelectField key={permission.label} label={permission.label} value={permission.value} />
        ))}
      </InspectorSection>

      <InspectorSection title="Condiciones previas">
        {settings.preconditions.map((condition) => (
          <label
            key={condition.id}
            className="flex items-start gap-2 border-b border-line-soft py-[7px] text-body-sm text-ink-2 last:border-b-0"
          >
            <Checkbox
              className="mt-px"
              label={condition.label}
              checked={preconditions[condition.id]}
              onCheckedChange={(checked) => setPrecondition(condition.id, checked)}
            />
            <span>{condition.label}</span>
          </label>
        ))}
      </InspectorSection>

      <InspectorSection title="Asistencia automática">
        {settings.automations.map((automation, index) => (
          <Fragment key={automation.id}>
            {index > 0 && <div className="h-3" />}
            <SwitchField
              title={automation.label}
              description={automation.description}
              checked={automations[automation.id]}
              onCheckedChange={(checked) => setAutomation(automation.id, checked)}
            />
          </Fragment>
        ))}
      </InspectorSection>
    </div>
  );
}
