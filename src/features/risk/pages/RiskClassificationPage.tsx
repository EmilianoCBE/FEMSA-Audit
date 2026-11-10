
import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page, PageHeader } from "@/shared/ui";

import { riskLibraryService } from "../services/riskLibraryService";
import { RiskLibraryControlExplorer } from "../components/RiskLibraryControlExplorer";

import type { RiskLibraryItem } from "../services/riskLibraryService";

const DEPARTMENTS = ["Beverage", "Retail & Spin"];

export function RiskClassificationPage() {
  const [risks, setRisks] = useState<RiskLibraryItem[]>([]);
  const [selectedRisk, setSelectedRisk] =
    useState<RiskLibraryItem | null>(null);

  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRiskLibrary() {
      setLibraryLoading(true);
      setLibraryError(null);

      try {
        const response = await riskLibraryService.getAll({
          search,
          department,
        });

        if (!cancelled) {
          setRisks(response.risks);

          setSelectedRisk((current) => {
            if (!current) return null;

            return (
              response.risks.find(
                (risk) =>
                  risk.risk_library_id === current.risk_library_id,
              ) ?? null
            );
          });
        }
      } catch (err) {
        if (!cancelled) {
          setRisks([]);
          setLibraryError(
            err instanceof ApiError
              ? err.message
              : "No se pudo cargar la biblioteca de riesgos.",
          );
        }
      } finally {
        if (!cancelled) {
          setLibraryLoading(false);
        }
      }
    }

    void loadRiskLibrary();

    return () => {
      cancelled = true;
    };
  }, [search, department]);

  function selectRisk(risk: RiskLibraryItem) {
    setSelectedRisk(risk);
  }

  return (
    <Page>
      <PageHeader
        title="Biblioteca de riesgos"
        description="Consulta los registros del Risk Register, sus controles, evaluaciones y riesgo residual."
      />

      <ContentArea>
        <div className="space-y-5">
          <section
            aria-label="Resumen de la biblioteca"
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-body-sm text-muted">
                <BookOpen size={17} />
                Riesgos en biblioteca
              </div>

              <div className="mt-2 text-heading font-semibold text-ink">
                {libraryLoading ? "…" : risks.length}
              </div>

              <p className="mt-1 text-body-sm text-muted">
                Resultados de la búsqueda actual.
              </p>
            </div>

            <div className="rounded-md border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-body-sm text-muted">
                <Check size={17} />
                Riesgo seleccionado
              </div>

              <div className="mt-2 truncate text-body font-semibold text-ink">
                {selectedRisk?.risk_library_id ?? "Ninguno"}
              </div>

              <p className="mt-1 truncate text-body-sm text-muted">
                {selectedRisk?.risk_name ??
                  "Selecciona una entrada de la biblioteca."}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="library-heading"
            className="rounded-md border border-line bg-surface p-4"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-md border border-line bg-nav p-2 text-accent">
                <BookOpen size={20} />
              </div>

              <div>
                <h2
                  id="library-heading"
                  className="text-body font-semibold text-ink"
                >
                  Entradas de Risk Library
                </h2>

                <p className="mt-1 text-body-sm text-muted">
                  Selecciona una entrada para consultar sus registros asociados.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="risk-search"
                  className="mb-1.5 block text-control font-medium text-ink"
                >
                  Buscar riesgo
                </label>

                <div className="flex items-center gap-2 rounded-[5px] border border-line-2 bg-surface px-3 focus-within:border-accent">
                  <Search size={17} className="shrink-0 text-muted" />

                  <input
                    id="risk-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Nombre o ID del riesgo..."
                    className="w-full min-w-0 border-0 bg-transparent py-2 text-body-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="risk-department"
                  className="mb-1.5 flex items-center gap-2 text-control font-medium text-ink"
                >
                  <SlidersHorizontal size={15} />
                  Departamento
                </label>

                <select
                  id="risk-department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="w-full rounded-[5px] border border-line-2 bg-surface px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">Todos los departamentos</option>
                  {DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-md border border-line">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-nav px-3 py-2.5">
                <span className="text-control font-medium text-ink">
                  Resultados
                </span>

                <span className="text-xs text-muted">
                  {libraryLoading ? "Cargando..." : risks.length}
                </span>
              </div>

              <div
                className="max-h-[340px] overflow-y-auto overscroll-contain"
                aria-label="Lista de riesgos disponibles"
              >
                {libraryLoading ? (
                  <div className="px-4 py-8 text-center text-body-sm text-muted">
                    Cargando biblioteca de riesgos...
                  </div>
                ) : libraryError ? (
                  <div
                    role="alert"
                    className="flex items-center gap-2 px-4 py-8 text-body-sm text-ink"
                  >
                    <AlertCircle size={18} className="shrink-0" />
                    {libraryError}
                  </div>
                ) : risks.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BookOpen size={24} className="mx-auto text-muted" />

                    <p className="mt-2 text-body-sm font-medium text-ink">
                      No hay riesgos para mostrar
                    </p>

                    <p className="mt-1 text-body-sm text-muted">
                      Intenta con otra búsqueda o departamento.
                    </p>
                  </div>
                ) : (
                  risks.map((risk) => {
                    const isSelected =
                      selectedRisk?.risk_library_id ===
                      risk.risk_library_id;

                    return (
                      <button
                        key={risk.risk_library_id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectRisk(risk)}
                        className={`flex w-full items-start gap-3 border-b border-line p-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                          isSelected
                            ? "bg-nav ring-1 ring-inset ring-accent"
                            : "bg-surface hover:bg-nav"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-accent bg-accent text-white"
                              : "border-line-2 text-transparent"
                          }`}
                        >
                          {isSelected && <Check size={13} />}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-body-sm font-medium text-ink">
                            {risk.risk_name}
                          </span>

                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                            <span>{risk.risk_library_id}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {risk.audit_department || "Sin departamento"}
                            </span>
                          </span>
                        </span>

                        {isSelected && (
                          <span className="shrink-0 text-xs font-medium text-accent">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {selectedRisk ? (
            <RiskLibraryControlExplorer
              key={selectedRisk.risk_library_id}
              selectedRisk={selectedRisk}
            />
          ) : (
            <section className="rounded-md border border-dashed border-line-2 bg-nav p-10 text-center">
              <ShieldAlertPlaceholder />
              <h2 className="mt-3 text-body font-semibold text-ink">
                Selecciona una entrada de Risk Library
              </h2>
              <p className="mt-1 text-body-sm text-muted">
                Aquí aparecerán sus registros RSK, controles, evaluaciones y análisis de riesgo residual.
              </p>
            </section>
          )}
        </div>
      </ContentArea>
    </Page>
  );
}

function ShieldAlertPlaceholder() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-muted">
      <BookOpen size={24} />
    </div>
  );
}




