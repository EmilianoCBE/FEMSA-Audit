import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { Button, ContentArea, DataTable, QueryState, SectionToolbar, type DataTableColumn } from "@/shared/ui";
import { FIELD_REQUIREMENT_LABELS, FIELD_TYPE_LABELS } from "../lib/formFields";
import { designerService } from "../services/designerService";
import type { ElementoDesigner, FormField, PlantillaDesigner } from "../types";

const OPCIONES_ELEMENTOS_DESIGNER: Array<{
  type: ElementoDesigner["type"];
  label: string;
  width: number;
  height: number;
}> = [
  { type: "short-text", label: "Texto corto", width: 240, height: 48 },
  { type: "long-text", label: "Texto largo", width: 360, height: 88 },
  { type: "date", label: "Fecha", width: 180, height: 48 },
  { type: "catalog", label: "Catalogo", width: 240, height: 48 },
  { type: "number", label: "Numero", width: 180, height: 48 },
  { type: "section", label: "Seccion", width: 420, height: 56 },
];

const COLUMNS: readonly DataTableColumn<FormField>[] = [
  { id: "name", header: "Campo", render: (field) => field.name },
  { id: "type", header: "Tipo", render: (field) => FIELD_TYPE_LABELS[field.type] },
  { id: "requirement", header: "Estado", render: (field) => FIELD_REQUIREMENT_LABELS[field.requirement] },
  { id: "actions", render: () => <Button variant="link">Editar</Button> },
];

// TODO(US07 - Karla Alessandra): agregar captura de probabilidad/impacto, cálculo y visualización del nivel de riesgo.
export function FieldsPanel() {
  const queryPlantillasDesigner = useQuery(designerService.listPlantillasDesigner);
  const [plantillaDesignerActual, setPlantillaDesignerActual] = useState<PlantillaDesigner>();
  const [mensajeDesigner, setMensajeDesigner] = useState<string>();
  const [errorDesigner, setErrorDesigner] = useState<string>();
  const [estaGuardandoDesigner, setEstaGuardandoDesigner] = useState(false);
  const [tieneCambiosDesigner, setTieneCambiosDesigner] = useState(false);

  useEffect(() => {
    if (!plantillaDesignerActual && queryPlantillasDesigner.data?.length) {
      setPlantillaDesignerActual(queryPlantillasDesigner.data[0]);
    }
  }, [plantillaDesignerActual, queryPlantillasDesigner.data]);

  const camposDesigner = useMemo<FormField[]>(() => {
    return (plantillaDesignerActual?.elements ?? []).map((elementoDesigner) => ({
      id: elementoDesigner.id,
      name: elementoDesigner.config.label ?? elementoDesigner.id,
      type: elementoDesigner.type === "number" || elementoDesigner.type === "section" ? "short-text" : elementoDesigner.type,
      requirement: elementoDesigner.config.required ? "required" : "optional",
    }));
  }, [plantillaDesignerActual]);

  const seleccionarPlantillaDesigner = async (plantillaDesignerId: string) => {
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaDesigner = await designerService.getPlantillaDesigner(plantillaDesignerId);
      setPlantillaDesignerActual(plantillaDesigner);
      setTieneCambiosDesigner(false);
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo cargar la plantilla Designer.");
    }
  };

  const crearPlantillaDesigner = async () => {
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const nuevaPlantillaDesigner = await designerService.createPlantillaDesigner("Modulo nuevo Designer", [
        {
          id: "campo_nuevo",
          type: "short-text",
          x: 32,
          y: 32,
          width: 240,
          height: 48,
          config: { label: "Campo nuevo", required: false },
        },
      ]);
      setPlantillaDesignerActual(nuevaPlantillaDesigner);
      queryPlantillasDesigner.reload();
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Plantilla Designer creada desde el backend.");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo crear la plantilla Designer.");
    }
  };

  const actualizarElementosDesigner = (elementosDesigner: ElementoDesigner[]) => {
    setMensajeDesigner(undefined);
    setTieneCambiosDesigner(true);
    setPlantillaDesignerActual((plantillaDesigner) => plantillaDesigner ? { ...plantillaDesigner, elements: elementosDesigner } : plantillaDesigner);
  };

  const recargarPlantillaDesigner = async () => {
    if (!plantillaDesignerActual) return;

    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaDesigner = await designerService.getPlantillaDesigner(plantillaDesignerActual.id);
      setPlantillaDesignerActual(plantillaDesigner);
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Plantilla Designer recargada desde el backend.");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo recargar la plantilla Designer.");
    }
  };

  const guardarCanvasDesigner = async () => {
    if (!plantillaDesignerActual) return;

    setEstaGuardandoDesigner(true);
    setMensajeDesigner(undefined);
    setErrorDesigner(undefined);
    try {
      const plantillaGuardadaDesigner = await designerService.saveCanvasDesigner(
        plantillaDesignerActual.id,
        plantillaDesignerActual.elements,
      );
      setPlantillaDesignerActual(plantillaGuardadaDesigner);
      setTieneCambiosDesigner(false);
      setMensajeDesigner("Canvas guardado correctamente en el backend.");
    } catch (error) {
      setErrorDesigner(error instanceof Error ? error.message : "No se pudo guardar el canvas.");
    } finally {
      setEstaGuardandoDesigner(false);
    }
  };

  return (
    <ContentArea>
      <SectionToolbar
        description="Campos disponibles para el registro y seguimiento de hallazgos. Los elementos del canvas vienen del backend de US03."
        action={<Button variant="primary" onClick={crearPlantillaDesigner}>Nueva plantilla</Button>}
      />
      <QueryState query={queryPlantillasDesigner}>
        {(plantillasDesigner) => (
          <div className="grid gap-4 desktop:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label htmlFor="plantilla-designer" className="text-body-sm font-medium text-ink-2">
                  Plantilla Designer
                </label>
                <select
                  id="plantilla-designer"
                  className="rounded border border-line-2 bg-surface px-2 py-1.5 text-body-sm"
                  value={plantillaDesignerActual?.id ?? ""}
                  onChange={(event) => seleccionarPlantillaDesigner(event.target.value)}
                >
                  {plantillasDesigner.map((plantillaDesigner) => (
                    <option key={plantillaDesigner.id} value={plantillaDesigner.id}>
                      {plantillaDesigner.name}
                    </option>
                  ))}
                </select>
                <Button onClick={guardarCanvasDesigner} disabled={!plantillaDesignerActual || estaGuardandoDesigner}>
                  {estaGuardandoDesigner ? "Guardando..." : "Guardar canvas"}
                </Button>
                <Button onClick={recargarPlantillaDesigner} disabled={!plantillaDesignerActual || estaGuardandoDesigner}>
                  Recargar
                </Button>
                {tieneCambiosDesigner && <span className="text-body-sm text-amber">Cambios sin guardar</span>}
              </div>

              {errorDesigner && (
                <div role="alert" className="mb-3 rounded-md border border-red-line bg-red-bg px-3 py-2 text-body-sm text-red">
                  {errorDesigner}
                </div>
              )}
              {mensajeDesigner && (
                <div role="status" className="mb-3 rounded-md border border-green-line bg-green-bg px-3 py-2 text-body-sm text-green">
                  {mensajeDesigner}
                </div>
              )}

              <CanvasDesigner
                elementosDesigner={plantillaDesignerActual?.elements ?? []}
                onElementosChange={actualizarElementosDesigner}
              />
            </section>

            <aside>
              <div className="mb-2 text-body-sm font-medium text-ink-2">Elementos del backend</div>
              <DataTable columns={COLUMNS} rows={camposDesigner} getRowKey={(field) => field.id} />
            </aside>
          </div>
        )}
      </QueryState>
    </ContentArea>
  );
}

function CanvasDesigner({
  elementosDesigner,
  onElementosChange,
}: {
  elementosDesigner: ElementoDesigner[];
  onElementosChange: (elementosDesigner: ElementoDesigner[]) => void;
}) {
  const canvasDesignerRef = useRef<HTMLDivElement>(null);
  const [elementoActivoDesigner, setElementoActivoDesigner] = useState<string>();

  const agregarElementoDesigner = (tipoDesigner: ElementoDesigner["type"], x: number, y: number) => {
    const opcionDesigner = OPCIONES_ELEMENTOS_DESIGNER.find((opcionDesigner) => opcionDesigner.type === tipoDesigner);
    if (!opcionDesigner) return;

    const nuevoElementoDesigner: ElementoDesigner = {
      id: `elemento_${tipoDesigner}_${Date.now()}`,
      type: tipoDesigner,
      x,
      y,
      width: opcionDesigner.width,
      height: opcionDesigner.height,
      config: { label: opcionDesigner.label, required: false },
    };

    onElementosChange([...elementosDesigner, nuevoElementoDesigner]);
  };

  const soltarElementoDesigner = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const tipoDesigner = event.dataTransfer.getData("application/femsa-designer") as ElementoDesigner["type"];
    const canvasDesigner = canvasDesignerRef.current;
    const opcionDesigner = OPCIONES_ELEMENTOS_DESIGNER.find((itemDesigner) => itemDesigner.type === tipoDesigner);
    if (!tipoDesigner || !canvasDesigner || !opcionDesigner) return;

    const rectCanvasDesigner = canvasDesigner.getBoundingClientRect();
    const xDesigner = Math.max(0, Math.min(event.clientX - rectCanvasDesigner.left - 12, rectCanvasDesigner.width - opcionDesigner.width));
    const yDesigner = Math.max(0, Math.min(event.clientY - rectCanvasDesigner.top - 12, rectCanvasDesigner.height - opcionDesigner.height));
    agregarElementoDesigner(tipoDesigner, Math.round(xDesigner), Math.round(yDesigner));
  };

  const iniciarArrastreDesigner = (event: React.PointerEvent<HTMLButtonElement>, elementoDesigner: ElementoDesigner) => {
    const canvasDesigner = canvasDesignerRef.current;
    if (!canvasDesigner) return;

    const inicioXDesigner = event.clientX;
    const inicioYDesigner = event.clientY;
    const posicionInicialDesigner = { x: elementoDesigner.x, y: elementoDesigner.y };

    setElementoActivoDesigner(elementoDesigner.id);
    event.currentTarget.setPointerCapture(event.pointerId);

    const moverElementoDesigner = (moveEvent: PointerEvent) => {
      const rectCanvasDesigner = canvasDesigner.getBoundingClientRect();
      const nuevoXDesigner = Math.max(0, Math.min(posicionInicialDesigner.x + moveEvent.clientX - inicioXDesigner, rectCanvasDesigner.width - elementoDesigner.width));
      const nuevoYDesigner = Math.max(0, Math.min(posicionInicialDesigner.y + moveEvent.clientY - inicioYDesigner, rectCanvasDesigner.height - elementoDesigner.height));

      onElementosChange(
        elementosDesigner.map((itemDesigner) =>
          itemDesigner.id === elementoDesigner.id
            ? { ...itemDesigner, x: Math.round(nuevoXDesigner), y: Math.round(nuevoYDesigner) }
            : itemDesigner,
        ),
      );
    };

    const terminarArrastreDesigner = () => {
      setElementoActivoDesigner(undefined);
      window.removeEventListener("pointermove", moverElementoDesigner);
      window.removeEventListener("pointerup", terminarArrastreDesigner);
    };

    window.addEventListener("pointermove", moverElementoDesigner);
    window.addEventListener("pointerup", terminarArrastreDesigner);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-line bg-nav p-3">
        <div className="mb-2 text-body-sm font-medium text-ink-2">Paleta Designer</div>
        <div className="flex flex-wrap gap-2">
          {OPCIONES_ELEMENTOS_DESIGNER.map((opcionDesigner) => (
            <button
              key={opcionDesigner.type}
              type="button"
              draggable
              className="rounded border border-line-2 bg-surface px-3 py-1.5 text-body-sm text-ink-2 hover:bg-surface-hover"
              onClick={() => agregarElementoDesigner(opcionDesigner.type, 32, 32)}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/femsa-designer", opcionDesigner.type);
                event.dataTransfer.effectAllowed = "copy";
              }}
            >
              {opcionDesigner.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={canvasDesignerRef}
        className="relative h-[420px] overflow-hidden rounded-md border border-line bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] bg-size-[20px_20px]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={soltarElementoDesigner}
      >
        {!elementosDesigner.length && (
          <div className="absolute inset-0 flex items-center justify-center text-body-sm text-muted">
            Arrastra un elemento desde la paleta Designer.
          </div>
        )}

        {elementosDesigner.map((elementoDesigner) => (
          <button
            key={elementoDesigner.id}
            type="button"
            className="absolute touch-none rounded-md border border-line-2 bg-surface px-3 py-2 text-left shadow-[0_1px_2px_rgba(17,24,39,.08)] focus:ring-2 focus:ring-accent focus:outline-none"
            style={{
              left: elementoDesigner.x,
              top: elementoDesigner.y,
              width: elementoDesigner.width,
              height: elementoDesigner.height,
            }}
            aria-label={`Mover ${elementoDesigner.config.label ?? elementoDesigner.id}`}
            onPointerDown={(event) => iniciarArrastreDesigner(event, elementoDesigner)}
          >
            <span className="block truncate text-body-sm font-medium text-ink">{elementoDesigner.config.label ?? elementoDesigner.id}</span>
            <span className="mt-1 block text-label text-muted">
              {elementoDesigner.type} · x:{elementoDesigner.x} y:{elementoDesigner.y}
            </span>
            {elementoActivoDesigner === elementoDesigner.id && <span className="absolute inset-0 rounded-md ring-2 ring-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}
