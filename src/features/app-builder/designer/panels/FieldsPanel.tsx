import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, QueryState, SectionToolbar } from "@/shared/ui";
import { designerService } from "../services/designerService";
import type { ElementoDesigner, FormFieldType, PlantillaDesigner } from "../types";

type SeccionDesigner = "identificacion" | "evaluacion" | "remediacion";

const SECCIONES_DESIGNER: Array<{ id: SeccionDesigner; label: string }> = [
  { id: "identificacion", label: "Identificacion" },
  { id: "evaluacion", label: "Evaluacion" },
  { id: "remediacion", label: "Remediacion" },
];

const ESTADOS_WORKFLOW_DESIGNER = [
  { id: "borrador", label: "Borrador" },
  { id: "revision", label: "En revision" },
  { id: "validacion_jefatura", label: "Validacion del responsable" },
  { id: "validacion_direccion", label: "Validacion direccion" },
  { id: "cerrado", label: "Cerrado (solo lectura)" },
];

const OPCIONES_ELEMENTOS_DESIGNER: Array<{
  type: ElementoDesigner["type"];
  label: string;
  description: string;
  grupo: "basicos" | "avanzados";
}> = [
  { type: "short-text", label: "Texto corto", description: "Texto corto · max. 120 caracteres", grupo: "basicos" },
  { type: "long-text", label: "Texto largo", description: "Texto largo · editor enriquecido", grupo: "basicos" },
  { type: "catalog", label: "Lista de opciones", description: "Seleccion desde catalogo", grupo: "basicos" },
  { type: "date", label: "Fecha", description: "Fecha · no menor a hoy", grupo: "basicos" },
  { type: "number", label: "Numerico", description: "Valor numerico", grupo: "basicos" },
  { type: "section", label: "Adjunto", description: "Adjunto · multiple", grupo: "avanzados" },
  { type: "catalog", label: "Usuario / rol", description: "Usuario del area auditada", grupo: "avanzados" },
  { type: "catalog", label: "Referencia", description: "Referencia a catalogo", grupo: "avanzados" },
  {
    type: "calculated",
    label: "Campo calculado",
    description: "Calculado · severidad x probabilidad",
    grupo: "avanzados",
  },
];

const TIPO_BADGE_DESIGNER: Record<ElementoDesigner["type"], string> = {
  "short-text": "Texto",
  "long-text": "Texto",
  catalog: "Lista",
  calculated: "Calculado",
  date: "Fecha",
  number: "Numero",
  section: "Adjunto",
};

const TIPO_SELECT_DESIGNER: Array<{ value: ElementoDesigner["type"]; label: string }> = [
  { value: "short-text", label: "Texto corto" },
  { value: "long-text", label: "Texto largo" },
  { value: "catalog", label: "Lista de opciones" },
  { value: "date", label: "Fecha" },
  { value: "number", label: "Numerico" },
  { value: "calculated", label: "Campo calculado" },
  { value: "section", label: "Adjunto" },
];

const normalizarElementoDesigner = (elementoDesigner: ElementoDesigner, indiceDesigner: number): ElementoDesigner => ({
  ...elementoDesigner,
  x: elementoDesigner.x ?? 0,
  y: elementoDesigner.y ?? indiceDesigner,
  width: elementoDesigner.width || 520,
  height: elementoDesigner.height || 64,
  config: {
    section: (elementoDesigner.config.section as SeccionDesigner | undefined) ?? inferirSeccionDesigner(indiceDesigner),
    description: elementoDesigner.config.description ?? descripcionPorTipoDesigner(elementoDesigner.type),
    editable: elementoDesigner.config.editable ?? false,
    includeInReports: elementoDesigner.config.includeInReports ?? false,
    visibleStates: (elementoDesigner.config.visibleStates as string[] | undefined) ?? [
      "revision",
      "validacion_jefatura",
    ],
    ...elementoDesigner.config,
  },
});

const inferirSeccionDesigner = (indiceDesigner: number): SeccionDesigner => {
  if (indiceDesigner < 3) return "identificacion";
  if (indiceDesigner < 6) return "evaluacion";
  return "remediacion";
};

const descripcionPorTipoDesigner = (tipoDesigner: ElementoDesigner["type"]) => {
  const opcionDesigner = OPCIONES_ELEMENTOS_DESIGNER.find((opcionDesigner) => opcionDesigner.type === tipoDesigner);
  return opcionDesigner?.description ?? "Campo configurable";
};

// TODO(US03 - Magda): conectar reordenamiento entre secciones si el equipo requiere persistir orden manual.
export function FieldsPanel() {
  const queryPlantillasDesigner = useQuery(designerService.listPlantillasDesigner);
  const [plantillaDesignerActual, setPlantillaDesignerActual] = useState<PlantillaDesigner>();
  const [campoSeleccionadoDesignerId, setCampoSeleccionadoDesignerId] = useState<string>();
  const [mensajeDesigner, setMensajeDesigner] = useState<string>();
  const [errorDesigner, setErrorDesigner] = useState<string>();
  const [estaGuardandoDesigner, setEstaGuardandoDesigner] = useState(false);
  const [tieneCambiosDesigner, setTieneCambiosDesigner] = useState(false);

  useEffect(() => {
    if (!plantillaDesignerActual && queryPlantillasDesigner.data?.length) {
      const plantillaDesigner = normalizarPlantillaDesigner(queryPlantillasDesigner.data[0]);
      setPlantillaDesignerActual(plantillaDesigner);
      setCampoSeleccionadoDesignerId(plantillaDesigner.elements[0]?.id);
    }
  }, [plantillaDesignerActual, queryPlantillasDesigner.data]);

  const elementosDesigner = plantillaDesignerActual?.elements ?? [];
  const campoSeleccionadoDesigner = useMemo(
    () =>
      elementosDesigner.find((elementoDesigner) => elementoDesigner.id === campoSeleccionadoDesignerId) ??
      elementosDesigner[0],
    [campoSeleccionadoDesignerId, elementosDesigner],
  );

  const actualizarElementosDesigner = (elementosActualizadosDesigner: ElementoDesigner[]) => {
    setMensajeDesigner(undefined);
    setTieneCambiosDesigner(true);
    setPlantillaDesignerActual((plantillaDesigner) =>
      plantillaDesigner ? { ...plantillaDesigner, elements: elementosActualizadosDesigner } : plantillaDesigner,
    );
  };

  const actualizarCampoDesigner = (campoDesignerId: string, cambiosDesigner: Partial<ElementoDesigner>) => {
    actualizarElementosDesigner(
      elementosDesigner.map((elementoDesigner) =>
        elementoDesigner.id === campoDesignerId
          ? {
              ...elementoDesigner,
              ...cambiosDesigner,
              config: { ...elementoDesigner.config, ...cambiosDesigner.config },
            }
          : elementoDesigner,
      ),
    );
  };

  const agregarCampoDesigner = (
    tipoDesigner: ElementoDesigner["type"],
    seccionDesigner: SeccionDesigner = "evaluacion",
  ) => {
    const opcionDesigner = OPCIONES_ELEMENTOS_DESIGNER.find((opcionDesigner) => opcionDesigner.type === tipoDesigner);
    const nuevoCampoDesigner: ElementoDesigner = {
      id: `campo_designer_${tipoDesigner}_${Date.now()}`,
      type: tipoDesigner,
      x: 0,
      y: elementosDesigner.length,
      width: 520,
      height: tipoDesigner === "long-text" ? 72 : 56,
      config: {
        label: opcionDesigner?.label ?? "Campo nuevo",
        section: seccionDesigner,
        description: opcionDesigner?.description ?? descripcionPorTipoDesigner(tipoDesigner),
        required: false,
        editable: false,
        includeInReports: false,
        visibleStates: ["revision", "validacion_jefatura"],
      },
    };

    actualizarElementosDesigner([...elementosDesigner, nuevoCampoDesigner]);
    setCampoSeleccionadoDesignerId(nuevoCampoDesigner.id);
  };

  const soltarCampoDesigner = (event: React.DragEvent<HTMLElement>, seccionDesigner: SeccionDesigner) => {
    event.preventDefault();
    const tipoDesigner = event.dataTransfer.getData("application/femsa-designer") as ElementoDesigner["type"];
    if (tipoDesigner) agregarCampoDesigner(tipoDesigner, seccionDesigner);
  };

  const seleccionarPlantillaDesigner = async (plantillaDesignerId: string) => {
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaDesigner = normalizarPlantillaDesigner(
        await designerService.getPlantillaDesigner(plantillaDesignerId),
      );
      setPlantillaDesignerActual(plantillaDesigner);
      setCampoSeleccionadoDesignerId(plantillaDesigner.elements[0]?.id);
      setTieneCambiosDesigner(false);
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo cargar la plantilla Designer.");
    }
  };

  const crearPlantillaDesigner = async () => {
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const nuevaPlantillaDesigner = normalizarPlantillaDesigner(
        await designerService.createPlantillaDesigner("Formulario de hallazgo", crearCamposBaseDesigner()),
      );
      setPlantillaDesignerActual(nuevaPlantillaDesigner);
      setCampoSeleccionadoDesignerId(nuevaPlantillaDesigner.elements[0]?.id);
      queryPlantillasDesigner.reload();
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Plantilla creada");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo crear la plantilla Designer.");
    }
  };

  const recargarPlantillaDesigner = async () => {
    if (!plantillaDesignerActual) return;

    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaDesigner = normalizarPlantillaDesigner(
        await designerService.getPlantillaDesigner(plantillaDesignerActual.id),
      );
      setPlantillaDesignerActual(plantillaDesigner);
      setCampoSeleccionadoDesignerId(plantillaDesigner.elements[0]?.id);
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Cambios descartados. Se recargo la plantilla");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo recargar la plantilla");
    }
  };

  const guardarFormularioDesigner = async () => {
    if (!plantillaDesignerActual) return;

    setEstaGuardandoDesigner(true);
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaGuardadaDesigner = normalizarPlantillaDesigner(
        await designerService.saveCanvasDesigner(plantillaDesignerActual.id, plantillaDesignerActual.elements),
      );
      setPlantillaDesignerActual(plantillaGuardadaDesigner);
      setCampoSeleccionadoDesignerId(campoSeleccionadoDesigner?.id);
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Formulario guardado");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo guardar el formulario.");
    } finally {
      setEstaGuardandoDesigner(false);
    }
  };

  return (
    <ContentArea>
      <SectionToolbar
        description={
          <div>
            <h2 className="mb-1 text-title-sm font-semibold text-ink">Formulario de hallazgo</h2>
            <p>
              Define los campos que captura un hallazgo, sus validaciones y en que estados del workflow son visibles o
              editables.
            </p>
          </div>
        }
        action={
          <Button variant="primary" onClick={crearPlantillaDesigner}>
            Nueva plantilla
          </Button>
        }
      />

      <div className="mb-4 border-b border-line">
        <div className="flex gap-8 text-body-sm">
          <button type="button" className="border-b-2 border-accent px-1 pb-3 font-medium text-accent">
            Campos
          </button>
          <button type="button" className="px-1 pb-3 text-muted">
            Diseno por rol
          </button>
          <button type="button" className="px-1 pb-3 text-muted">
            Validaciones
          </button>
          <button type="button" className="px-1 pb-3 text-muted">
            Historial de versiones
          </button>
        </div>
      </div>

      <QueryState query={queryPlantillasDesigner}>
        {(plantillasDesigner) => (
          <div className="grid gap-0 overflow-hidden rounded-md border border-line bg-surface desktop:grid-cols-[230px_minmax(0,1fr)_340px]">
            <aside className="border-b border-line bg-nav p-4 desktop:border-r desktop:border-b-0">
              <div className="mb-4">
                <label htmlFor="plantilla-designer" className="mb-1 block text-label font-medium uppercase text-muted">
                  Plantilla
                </label>
                <select
                  id="plantilla-designer"
                  className="w-full rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
                  value={plantillaDesignerActual?.id ?? ""}
                  onChange={(event) => seleccionarPlantillaDesigner(event.target.value)}
                >
                  {plantillasDesigner.map((plantillaDesigner) => (
                    <option key={plantillaDesigner.id} value={plantillaDesigner.id}>
                      {plantillaDesigner.name}
                    </option>
                  ))}
                </select>
              </div>

              <PaletaDesigner
                grupoDesigner="basicos"
                tituloDesigner="Campos basicos"
                onAgregarDesigner={agregarCampoDesigner}
              />
              <PaletaDesigner
                grupoDesigner="avanzados"
                tituloDesigner="Avanzados"
                onAgregarDesigner={agregarCampoDesigner}
              />
            </aside>

            <main className="min-h-[680px] p-6">
              {errorDesigner && (
                <div
                  role="alert"
                  className="mb-3 rounded-md border border-red-line bg-red-bg px-3 py-2 text-body-sm text-red"
                >
                  {errorDesigner}
                </div>
              )}
              {mensajeDesigner && (
                <div
                  role="status"
                  className="mb-3 rounded-md border border-green-line bg-green-bg px-3 py-2 text-body-sm text-green"
                >
                  {mensajeDesigner}
                </div>
              )}

              <div className="space-y-6">
                {SECCIONES_DESIGNER.map((seccionDesigner) => (
                  <section
                    key={seccionDesigner.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => soltarCampoDesigner(event, seccionDesigner.id)}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-label font-semibold uppercase text-muted">{seccionDesigner.label}</h3>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                    <div className="space-y-2">
                      {elementosDesigner
                        .filter((elementoDesigner) => elementoDesigner.config.section === seccionDesigner.id)
                        .map((elementoDesigner) => (
                          <CampoFormularioDesigner
                            key={elementoDesigner.id}
                            elementoDesigner={elementoDesigner}
                            seleccionadoDesigner={campoSeleccionadoDesigner?.id === elementoDesigner.id}
                            onSeleccionarDesigner={() => setCampoSeleccionadoDesignerId(elementoDesigner.id)}
                          />
                        ))}
                      <button
                        type="button"
                        className="w-full rounded-md border border-dashed border-line-2 px-3 py-2 text-body-sm text-muted hover:border-accent hover:text-accent"
                        onClick={() => agregarCampoDesigner("short-text", seccionDesigner.id)}
                      >
                        + Agregar campo
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            </main>

            <aside className="border-t border-line bg-surface p-4 desktop:border-t-0 desktop:border-l">
              <PanelConfiguracionDesigner
                campoDesigner={campoSeleccionadoDesigner}
                onActualizarDesigner={actualizarCampoDesigner}
                onGuardarDesigner={guardarFormularioDesigner}
                onDescartarDesigner={recargarPlantillaDesigner}
                guardandoDesigner={estaGuardandoDesigner}
                tieneCambiosDesigner={tieneCambiosDesigner}
              />
            </aside>
          </div>
        )}
      </QueryState>
    </ContentArea>
  );
}

function PaletaDesigner({
  grupoDesigner,
  tituloDesigner,
  onAgregarDesigner,
}: {
  grupoDesigner: "basicos" | "avanzados";
  tituloDesigner: string;
  onAgregarDesigner: (tipoDesigner: ElementoDesigner["type"], seccionDesigner?: SeccionDesigner) => void;
}) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-label font-semibold uppercase text-muted">{tituloDesigner}</h3>
      <div className="space-y-2">
        {OPCIONES_ELEMENTOS_DESIGNER.filter((opcionDesigner) => opcionDesigner.grupo === grupoDesigner).map(
          (opcionDesigner) => (
            <button
              key={`${grupoDesigner}-${opcionDesigner.label}`}
              type="button"
              draggable
              className="flex w-full items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-left text-body-sm text-ink-2 hover:border-accent hover:text-accent"
              onClick={() => onAgregarDesigner(opcionDesigner.type)}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/femsa-designer", opcionDesigner.type);
                event.dataTransfer.effectAllowed = "copy";
              }}
            >
              <span className="text-muted">::</span>
              <span>{opcionDesigner.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function CampoFormularioDesigner({
  elementoDesigner,
  seleccionadoDesigner,
  onSeleccionarDesigner,
}: {
  elementoDesigner: ElementoDesigner;
  seleccionadoDesigner: boolean;
  onSeleccionarDesigner: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-4 rounded-md border bg-surface px-4 py-3 text-left shadow-[0_1px_2px_rgba(17,24,39,.04)] ${
        seleccionadoDesigner ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-2"
      }`}
      onClick={onSeleccionarDesigner}
    >
      <span className="text-muted">::</span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-semibold text-ink">
          {elementoDesigner.config.label ?? elementoDesigner.id}
          {elementoDesigner.config.required && <span className="text-red"> *</span>}
        </span>
        <span className="mt-0.5 block truncate text-label text-muted">
          {elementoDesigner.config.description ?? descripcionPorTipoDesigner(elementoDesigner.type)}
        </span>
      </span>
      <span className="rounded border border-line-2 bg-nav px-2 py-1 text-label font-medium text-muted">
        {TIPO_BADGE_DESIGNER[elementoDesigner.type]}
      </span>
    </button>
  );
}

function PanelConfiguracionDesigner({
  campoDesigner,
  onActualizarDesigner,
  onGuardarDesigner,
  onDescartarDesigner,
  guardandoDesigner,
  tieneCambiosDesigner,
}: {
  campoDesigner?: ElementoDesigner;
  onActualizarDesigner: (campoDesignerId: string, cambiosDesigner: Partial<ElementoDesigner>) => void;
  onGuardarDesigner: () => void;
  onDescartarDesigner: () => void;
  guardandoDesigner: boolean;
  tieneCambiosDesigner: boolean;
}) {
  if (!campoDesigner) {
    return <p className="text-body-sm text-muted">Selecciona un campo para editar su configuracion.</p>;
  }

  const visibleStatesDesigner = (campoDesigner.config.visibleStates as string[] | undefined) ?? [];

  const actualizarConfigDesigner = (configDesigner: Partial<ElementoDesigner["config"]>) => {
    onActualizarDesigner(campoDesigner.id, { config: configDesigner });
  };

  const cambiarEstadoDesigner = (estadoDesigner: string, activoDesigner: boolean) => {
    const nuevosEstadosDesigner = activoDesigner
      ? [...new Set([...visibleStatesDesigner, estadoDesigner])]
      : visibleStatesDesigner.filter((itemDesigner) => itemDesigner !== estadoDesigner);
    actualizarConfigDesigner({ visibleStates: nuevosEstadosDesigner });
  };

  return (
    <div>
      <div className="border-b border-line pb-4">
        <div className="text-label font-semibold uppercase text-muted">Campo seleccionado</div>
        <h2 className="mt-1 text-body-sm font-semibold text-ink">{campoDesigner.config.label ?? campoDesigner.id}</h2>
      </div>

      <div className="space-y-4 border-b border-line py-4">
        <div className="text-label font-semibold uppercase text-muted">General</div>
        <label className="block text-body-sm text-ink-2">
          Etiqueta
          <input
            className="mt-1 w-full rounded border border-line-2 px-3 py-2 text-body-sm"
            value={campoDesigner.config.label ?? ""}
            onChange={(event) => actualizarConfigDesigner({ label: event.target.value })}
          />
        </label>
        <label className="block text-body-sm text-ink-2">
          Tipo de campo
          <select
            className="mt-1 w-full rounded border border-line-2 px-3 py-2 text-body-sm"
            value={campoDesigner.type}
            onChange={(event) => onActualizarDesigner(campoDesigner.id, { type: event.target.value as FormFieldType })}
          >
            {TIPO_SELECT_DESIGNER.map((tipoDesigner) => (
              <option key={tipoDesigner.value} value={tipoDesigner.value}>
                {tipoDesigner.label}
              </option>
            ))}
          </select>
        </label>
        {campoDesigner.type === "calculated" && (
          <label className="block text-body-sm text-ink-2">
            Formula
            <input
              className="mt-1 w-full rounded border border-line-2 px-3 py-2 font-mono text-body-sm"
              value={(campoDesigner.config.formula as string | undefined) ?? ""}
              onChange={(event) => actualizarConfigDesigner({ formula: event.target.value })}
            />
          </label>
        )}
      </div>

      <div className="space-y-3 border-b border-line py-4">
        <div className="text-label font-semibold uppercase text-muted">Comportamiento</div>
        <ToggleDesigner
          labelDesigner="Obligatorio"
          checkedDesigner={Boolean(campoDesigner.config.required)}
          onChangeDesigner={(checkedDesigner) => actualizarConfigDesigner({ required: checkedDesigner })}
        />
        <ToggleDesigner
          labelDesigner="Editable manualmente"
          descriptionDesigner="Permite sobrescribir el calculo con justificacion."
          checkedDesigner={Boolean(campoDesigner.config.editable)}
          onChangeDesigner={(checkedDesigner) => actualizarConfigDesigner({ editable: checkedDesigner })}
        />
        <ToggleDesigner
          labelDesigner="Incluir en reportes"
          descriptionDesigner="Se expone al modulo de Reportes y a Power BI."
          checkedDesigner={Boolean(campoDesigner.config.includeInReports)}
          onChangeDesigner={(checkedDesigner) => actualizarConfigDesigner({ includeInReports: checkedDesigner })}
        />
      </div>

      <div className="space-y-2 border-b border-line py-4">
        <div className="text-label font-semibold uppercase text-muted">Visibilidad por estado</div>
        {ESTADOS_WORKFLOW_DESIGNER.map((estadoDesigner) => (
          <label
            key={estadoDesigner.id}
            className="flex items-center gap-2 border-b border-line py-2 text-body-sm text-ink-2 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={visibleStatesDesigner.includes(estadoDesigner.id)}
              onChange={(event) => cambiarEstadoDesigner(estadoDesigner.id, event.target.checked)}
            />
            {estadoDesigner.label}
          </label>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" onClick={onGuardarDesigner} disabled={guardandoDesigner}>
          {guardandoDesigner ? "Guardando..." : "Guardar"}
        </Button>
        <Button onClick={onDescartarDesigner} disabled={guardandoDesigner || !tieneCambiosDesigner}>
          Descartar
        </Button>
      </div>
    </div>
  );
}

function ToggleDesigner({
  labelDesigner,
  descriptionDesigner,
  checkedDesigner,
  onChangeDesigner,
}: {
  labelDesigner: string;
  descriptionDesigner?: string;
  checkedDesigner: boolean;
  onChangeDesigner: (checkedDesigner: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 text-body-sm text-ink-2">
      <span>
        <span className="block font-medium text-ink">{labelDesigner}</span>
        {descriptionDesigner && <span className="mt-0.5 block text-label text-muted">{descriptionDesigner}</span>}
      </span>
      <input
        type="checkbox"
        className="mt-1"
        checked={checkedDesigner}
        onChange={(event) => onChangeDesigner(event.target.checked)}
      />
    </label>
  );
}

function normalizarPlantillaDesigner(plantillaDesigner: PlantillaDesigner): PlantillaDesigner {
  return {
    ...plantillaDesigner,
    elements: plantillaDesigner.elements.map(normalizarElementoDesigner),
  };
}

function crearCamposBaseDesigner(): ElementoDesigner[] {
  return [
    crearCampoBaseDesigner(
      "titulo_hallazgo",
      "short-text",
      "Titulo del hallazgo",
      "Texto corto · max. 120 caracteres",
      "identificacion",
      true,
    ),
    crearCampoBaseDesigner(
      "control_asociado",
      "catalog",
      "Control asociado",
      "Referencia al Catalogo de controles",
      "identificacion",
      true,
    ),
    crearCampoBaseDesigner(
      "tipo_hallazgo",
      "catalog",
      "Tipo de hallazgo",
      "Diseno · Efectividad · Cumplimiento",
      "identificacion",
      true,
    ),
    crearCampoBaseDesigner(
      "descripcion_condicion",
      "long-text",
      "Descripcion y condicion",
      "Texto largo · editor enriquecido",
      "evaluacion",
      true,
    ),
    crearCampoBaseDesigner(
      "evidencia_soporte",
      "section",
      "Evidencia de soporte",
      "Adjunto · multiple · hasta 1 GB por archivo",
      "evaluacion",
      true,
    ),
    {
      ...crearCampoBaseDesigner(
        "riesgo_residual",
        "calculated",
        "Riesgo residual",
        "Calculado · severidad x probabilidad",
        "evaluacion",
        false,
      ),
      config: {
        label: "Riesgo residual",
        section: "evaluacion",
        description: "Calculado · severidad x probabilidad, recalcula al guardar el plan",
        required: true,
        formula: "severidad * probabilidad",
        editable: false,
        includeInReports: true,
        visibleStates: ["revision", "validacion_jefatura", "validacion_direccion", "cerrado"],
      },
    },
    crearCampoBaseDesigner(
      "responsable_plan",
      "catalog",
      "Responsable del plan",
      "Usuario del area auditada",
      "remediacion",
      true,
    ),
    crearCampoBaseDesigner(
      "fecha_compromiso",
      "date",
      "Fecha compromiso",
      "Fecha · no menor a hoy",
      "remediacion",
      true,
    ),
  ];
}

function crearCampoBaseDesigner(
  idDesigner: string,
  tipoDesigner: ElementoDesigner["type"],
  labelDesigner: string,
  descripcionDesigner: string,
  seccionDesigner: SeccionDesigner,
  requeridoDesigner: boolean,
): ElementoDesigner {
  return {
    id: idDesigner,
    type: tipoDesigner,
    x: 0,
    y: 0,
    width: 520,
    height: tipoDesigner === "long-text" ? 72 : 56,
    config: {
      label: labelDesigner,
      section: seccionDesigner,
      description: descripcionDesigner,
      required: requeridoDesigner,
      editable: false,
      includeInReports: false,
      visibleStates: ["revision", "validacion_jefatura"],
    },
  };
}
