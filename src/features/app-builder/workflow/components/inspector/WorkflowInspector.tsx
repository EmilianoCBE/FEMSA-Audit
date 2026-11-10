import { Inspector, SegmentedControl, type SegmentedOption } from "@/shared/ui";
import { DesignAssistantPanel } from "./DesignAssistantPanel";
import { FlowEditorPanel } from "./FlowEditorPanel";

export type InspectorView = "settings" | "assistant";

const VIEW_OPTIONS: readonly SegmentedOption<InspectorView>[] = [
  { value: "settings", label: "Configuración" },
  { value: "assistant", label: "Asistente de diseño" },
];

type WorkflowInspectorProps = {
  view: InspectorView;
  onViewChange: (view: InspectorView) => void;
  /** Fase 2: edición manual de estados y transiciones. */
  editor: React.ComponentProps<typeof FlowEditorPanel>;
  assistant: React.ComponentProps<typeof DesignAssistantPanel>;
};

export function WorkflowInspector({ view, onViewChange, editor, assistant }: WorkflowInspectorProps) {
  return (
    <Inspector>
      <SegmentedControl className="px-3 pt-2.5" options={VIEW_OPTIONS} value={view} onValueChange={onViewChange} />
      {view === "settings" ? <FlowEditorPanel {...editor} /> : <DesignAssistantPanel {...assistant} />}
    </Inspector>
  );
}
