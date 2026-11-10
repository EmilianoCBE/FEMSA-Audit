import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { aiUnavailableMessage, assistantErrorMessage } from "@/features/app-builder/assistant/lib/aiAvailability";
import { Button } from "@/shared/ui";
import { hasPersonalData } from "../../lib/workflowAi";
import { diagramFromOutline, WORKFLOW_TEMPLATES } from "../../lib/workflowTemplates";
import { workflowAiService } from "../../services/workflowAiService";
import type { WorkflowDiagram } from "../../types";

// Fase 3 del workflow (RF-17) - Emiliano Carrizales: proponer un flujo completo a partir de una descripción, o empezar
// desde una plantilla de auditoría (sin IA: también sirve cuando la IA no está disponible, US18). Nada se aplica
// hasta que el usuario revisa la vista previa y elige "Usar este flujo".

export type FlowProposal = { diagram: WorkflowDiagram; summary: string; source: "ai" | "template" };

const GENERATE_TIMEOUT_MS = 20_000;
const MIN_LENGTH = 15;
const MAX_LENGTH = 1000;

export function GenerateFlowSection({ onPropose }: { onPropose: (proposal: FlowProposal) => void }) {
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "warning" | "info"; text: string }>();
  const tooShort = description.trim().length < MIN_LENGTH;

  async function generate() {
    setGenerating(true);
    setMessage(undefined);
    try {
      const result = await workflowAiService.generate(description.trim(), AbortSignal.timeout(GENERATE_TIMEOUT_MS));
      if (!result.aiAvailable) {
        setMessage({
          tone: "warning",
          text: `${aiUnavailableMessage(result.aiUnavailableReason, result.aiRetryAt)} Puedes empezar desde una plantilla.`,
        });
      } else if (!result.workflow) {
        setMessage({
          tone: "warning",
          text: "La IA no propuso un flujo que se pueda usar. Describe el proceso con más detalle o usa una plantilla.",
        });
      } else {
        onPropose({ diagram: diagramFromOutline(result.workflow), summary: result.workflow.summary, source: "ai" });
        if (result.redacted) {
          setMessage({ tone: "info", text: "Se quitaron correos o teléfonos de la descripción antes de enviarla." });
        }
      }
    } catch (reason) {
      setMessage({ tone: "error", text: assistantErrorMessage(reason, "el flujo") });
    } finally {
      setGenerating(false);
    }
  }

  const tone = {
    error: "border-red-line bg-red-bg text-red",
    warning: "border-amber-line bg-amber-bg text-amber",
    info: "border-line-2 bg-nav text-ink-2",
  };

  return (
    <details className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-body-sm font-medium text-ink">
        Crear el flujo desde una descripción
        <ChevronDown aria-hidden size={15} className="text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2.5 px-4 pb-3.5">
        <label className="block text-label text-ink-2">
          Describe cómo se atiende un hallazgo en tu área
          <textarea
            className="mt-1 h-24 w-full resize-y rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm text-ink"
            maxLength={MAX_LENGTH}
            value={description}
            placeholder="Por ejemplo: el auditor documenta, el jefe revisa y puede devolver, el área responde con un plan de acción, dirección aprueba y damos seguimiento hasta validar la evidencia."
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <p className="text-label text-muted">
          Solo esta descripción se envía a la IA. No escribas nombres de personas ni datos confidenciales; los correos y
          teléfonos se quitan antes de enviar.
        </p>
        {hasPersonalData(description) && (
          <p role="status" className="text-label text-amber">
            Tu descripción parece tener un correo o un teléfono: se quitarán antes de enviarla.
          </p>
        )}
        <Button
          size="sm"
          variant="primary"
          className="w-full"
          disabled={generating || tooShort}
          title={tooShort ? `Escribe al menos ${MIN_LENGTH} caracteres.` : undefined}
          onClick={generate}
        >
          {generating ? "Generando propuesta…" : "Proponer flujo con IA"}
        </Button>
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={`rounded-md border px-2.5 py-1.5 text-label ${tone[message.tone]}`}
          >
            {message.text}
          </p>
        )}

        <div className="pt-1">
          <div className="mb-1.5 text-label font-medium text-muted">O empieza desde una plantilla (sin IA)</div>
          <ul className="space-y-1.5">
            {WORKFLOW_TEMPLATES.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  className="w-full rounded border border-line px-2.5 py-2 text-left hover:border-accent-line hover:bg-accent-bg/40"
                  onClick={() =>
                    onPropose({
                      diagram: diagramFromOutline(template.outline),
                      summary: template.description,
                      source: "template",
                    })
                  }
                >
                  <span className="block text-body-sm font-medium text-ink">{template.name}</span>
                  <span className="block text-label text-muted">{template.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
