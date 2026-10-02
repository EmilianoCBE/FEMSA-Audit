/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API. En desarrollo no se define y se usa el proxy de Vite (/api). */
  readonly VITE_API_URL?: string;
}
