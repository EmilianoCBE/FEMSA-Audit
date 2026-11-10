import { useEffect } from "react";
import { useQuery } from "@/shared/hooks/useQuery";
import { aiUnavailableMessage, MANUAL_STILL_WORKS } from "../lib/aiAvailability";
import { assistantService } from "../services/assistantService";

/** Con el panel abierto se vuelve a preguntar, para notar si la IA se cae o se recupera. */
const STATUS_REFRESH_MS = 60_000;

/** US18: si la IA está disponible, antes de analizar (el servidor la comprueba con una consulta ligera). */
export function AiStatusNotice() {
  const { data, error, isLoading, reload } = useQuery(assistantService.status);

  useEffect(() => {
    const timer = setInterval(reload, STATUS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);

  if (!data && isLoading) {
    return (
      <p role="status" className="mt-2 text-label text-muted">
        Comprobando la IA…
      </p>
    );
  }
  if (error) {
    return (
      <p role="status" className="mt-2 text-label text-muted">
        No se pudo consultar el estado de la IA. {MANUAL_STILL_WORKS}
      </p>
    );
  }
  if (!data) return null;
  if (data.aiAvailable) {
    return <p className="mt-2 text-label text-green">● IA disponible</p>;
  }
  return (
    <div
      role="status"
      aria-label="Estado de la IA"
      className="mt-3 rounded-md border border-amber-line bg-amber-bg px-3 py-2 text-body-sm text-amber"
    >
      {aiUnavailableMessage(data.reason, data.retryAt)}
    </div>
  );
}
