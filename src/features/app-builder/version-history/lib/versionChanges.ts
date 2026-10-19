import type { AppConfig } from "../types";

/** Texto del formulario -> lista de cambios: una línea por cambio, sin líneas vacías ni viñetas. */
export function parseChanges(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

/** Nombres de los campos guardados en una versión, para mostrarlos al consultarla. */
export function describeConfig(config: AppConfig): string[] {
  return (config.elements ?? []).map((element) => element.config?.label?.trim() || `Campo ${element.type}`);
}
