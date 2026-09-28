import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge debe conocer la escala tipográfica definida en `styles/index.css`;
 * si no, trataría `text-body` como color y lo eliminaría al combinarlo con `text-ink`.
 * Mantén esta lista sincronizada con los tokens `--text-*` del @theme.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["micro", "tiny", "caption", "label", "meta", "control", "body-sm", "body", "heading-sm", "heading"],
    },
  },
});

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind
 * (la última clase gana: cn("px-2", "px-4") -> "px-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
