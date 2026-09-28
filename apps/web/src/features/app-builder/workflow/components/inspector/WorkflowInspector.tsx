import { Inspector, SegmentedControl, type SegmentedOption } from "@/shared/ui";
import type { AssistantSuggestion, TransitionSettings } from "../../types";
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
  suggestions: readonly AssistantSuggestion[];
};

export function WorkflowInspector({ view, onViewChange, settings, suggestions }: WorkflowInspectorProps) {
  return (
    <Inspector>
      <SegmentedControl className="px-3 pt-2.5" options={VIEW_OPTIONS} value={view} onValueChange={onViewChange} />
      {view === "settings" ? (
        <TransitionSettingsPanel settings={settings} />
      ) : (
        <DesignAssistantPanel suggestions={suggestions} />
      )}
    </Inspector>
  );
}
