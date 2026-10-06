import { useState } from "react";
import { Calculator, ShieldAlert } from "lucide-react";
import { ApiError } from "@/shared/api/httpClient";
import { Button, ContentArea, Page, PageHeader } from "@/shared/ui";
import { riskService } from "../services/riskService";
import type { RiskClassification } from "../types";

const RISK_OPTIONS = [
  { value: 1, label: "1 - Muy baja" },
  { value: 2, label: "2 - Baja" },
  { value: 3, label: "3 - Media" },
  { value: 4, label: "4 - Alta" },
  { value: 5, label: "5 - Muy alta" },
];

function getLevelDescription(level: string) {
  switch (level) {
    case "Bajo":
      return "El riesgo se encuentra dentro de un nivel bajo.";
    case "Medio":
      return "El riesgo requiere seguimiento y evaluación.";
    case "Alto":
      return "El riesgo requiere atención y acciones de control.";
    case "Crítico":
      return "El riesgo requiere atención prioritaria.";
    default:
      return "";
  }
}

export function RiskClassificationPage() {
  const [probability, setProbability] = useState("3");
  const [impact, setImpact] = useState("3");
  const [result, setResult] = useState<RiskClassification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    setLoading(true);
    setError(null);

    try {
      const response = await riskService.classify({
        probability: Number(probability),
        impact: Number(impact),
      });

      setResult(response.result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo clasificar el riesgo.");
      }

      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Clasificación de riesgos"
        description="Ingresa la probabilidad y el impacto para obtener automáticamente el nivel de riesgo."
      />

      <ContentArea>
        <div className="max-w-[850px]">
          <div className="rounded-md border border-line bg-surface p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="mt-0.5 rounded-md border border-line bg-nav p-2 text-accent">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h2 className="m-0 text-body font-semibold text-ink">Evaluación del riesgo</h2>

                <p className="mt-1 text-body-sm text-muted">
                  Selecciona un valor del 1 al 5 para la probabilidad y el impacto.
                </p>
              </div>
            </div>

            <div className="grid gap-4 desktop:grid-cols-2">
              <div>
                <label htmlFor="probability" className="mb-1.5 block text-control font-medium text-ink">
                  Probabilidad
                </label>

                <select
                  id="probability"
                  value={probability}
                  onChange={(event) => setProbability(event.target.value)}
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                >
                  {RISK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="impact" className="mb-1.5 block text-control font-medium text-ink">
                  Impacto
                </label>

                <select
                  id="impact"
                  value={impact}
                  onChange={(event) => setImpact(event.target.value)}
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                >
                  {RISK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <Button variant="primary" onClick={() => void handleCalculate()} disabled={loading}>
                <Calculator size={16} />

                {loading ? "Calculando..." : "Clasificar riesgo"}
              </Button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-[5px] border border-line-2 bg-surface px-4 py-3 text-body-sm text-ink"
            >
              {error}
            </div>
          )}

          {result && (
            <div role="status" className="mt-5 rounded-md border border-line bg-surface p-5">
              <div className="mb-4">
                <h2 className="m-0 text-body font-semibold text-ink">Resultado</h2>

                <p className="mt-1 text-body-sm text-muted">
                  El nivel fue calculado automáticamente a partir de los valores proporcionados.
                </p>
              </div>

              <div className="grid gap-3 desktop:grid-cols-3">
                <div className="rounded-md border border-line bg-nav p-4">
                  <div className="text-control text-muted">Probabilidad</div>

                  <div className="mt-1 text-heading font-semibold text-ink">{result.probability}</div>
                </div>

                <div className="rounded-md border border-line bg-nav p-4">
                  <div className="text-control text-muted">Impacto</div>

                  <div className="mt-1 text-heading font-semibold text-ink">{result.impact}</div>
                </div>

                <div className="rounded-md border border-line bg-nav p-4">
                  <div className="text-control text-muted">Puntaje</div>

                  <div className="mt-1 text-heading font-semibold text-ink">{result.score}</div>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-line bg-nav p-4">
                <div className="text-control text-muted">Nivel de riesgo</div>

                <div className="mt-1 text-heading font-semibold text-ink">{result.level}</div>

                <p className="mt-1 text-body-sm text-muted">{getLevelDescription(result.level)}</p>
              </div>
            </div>
          )}
        </div>
      </ContentArea>
    </Page>
  );
}
