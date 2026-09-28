import { useState } from "react";
import { InspectorHeader, InspectorSection } from "@/shared/ui";
import type { AssistantSuggestion } from "../../types";
import { SuggestionCard } from "./SuggestionCard";

type Resolution = "applied" | "dismissed";

// TODO(US15 - Emiliano Carrizales): analizar contexto y generar recomendaciones explicadas.
// TODO(US16 - Emiliano Carrizales): detectar inconsistencias y explicar el motivo de cada alerta.
// TODO(US17 - Emiliano Carrizales): aceptar, rechazar o reemplazar recomendaciones sin aplicarlas automáticamente.
// TODO(US18 - Karla Alessandra): manejar caída del servicio de IA manteniendo funciones manuales.
export function DesignAssistantPanel({ suggestions }: { suggestions: readonly AssistantSuggestion[] }) {
  const [prompt, setPrompt] = useState("");
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  const resolve = (resolution: Resolution) => (suggestion: AssistantSuggestion) =>
    setResolutions((previous) => ({ ...previous, [suggestion.id]: resolution }));

  return (
    <div>
      <InspectorHeader eyebrow="Asistente de diseño" title="Mejoras sugeridas" />
      <InspectorSection>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-label="Instrucción para el asistente"
          placeholder="Describe una regla o cambio para este flujo..."
          className="block min-h-[74px] w-full resize-none rounded-md border border-line-2 bg-surface p-2.5 text-body-sm/[1.5] text-ink-2 placeholder:text-muted-2"
        />
        <div className="mt-[7px] text-meta/[1.45] text-muted">
          El asistente revisa permisos, salidas faltantes y consistencia entre estados.
        </div>
      </InspectorSection>
      <div className="px-4 py-3.5">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            resolved={suggestion.id in resolutions}
            onApply={resolve("applied")}
            onDismiss={resolve("dismissed")}
          />
        ))}
      </div>
    </div>
  );
}
