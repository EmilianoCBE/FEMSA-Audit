/**
 * Cliente HTTP único para hablar con la API. Los servicios de cada feature lo usan;
 * los componentes nunca llaman a fetch directamente.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

const UNREACHABLE_MESSAGE = "No se pudo conectar con el servidor. Verifica que la API esté corriendo.";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, UNREACHABLE_MESSAGE);
  }

  // 502/504: el proxy (Vite en desarrollo, gateway en producción) no alcanzó la API.
  if (response.status === 502 || response.status === 504) {
    throw new ApiError(response.status, UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { msg?: string } | null;
    throw new ApiError(response.status, body?.msg ?? `Error ${response.status} al llamar ${path}`);
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
