import { Inspector, SegmentedControl, type SegmentedOption } from "@/shared/ui";
import type { TransitionSettings } from "../../types";
import { DesignAssistantPanel } from "./DesignAssistantPanel";
import { TransitionSettingsPanel } from "./TransitionSettingsPanel";

export type InspectorView = "settings" | "assistant";

const VIEW_OPTIONS: readonly SegmentedOption<InspectorView>[] = [
  { value: "settings", label: "Configuración" },
  { value: "assistant", label: "Asistente de diseño" },
];

type WorkflowInspectorProps = {
  view: InspectorView;
  onViewChange: (view: InspectorView) => void;
  settings: TransitionSettings;
  assistant: React.ComponentProps<typeof DesignAssistantPanel>;
};

export function WorkflowInspector({ view, onViewChange, settings, assistant }: WorkflowInspectorProps) {
  return (
    <Inspector>
      <SegmentedControl className="px-3 pt-2.5" options={VIEW_OPTIONS} value={view} onValueChange={onViewChange} />
      {view === "settings" ? <TransitionSettingsPanel settings={settings} /> : <DesignAssistantPanel {...assistant} />}
    </Inspector>
  );
}
