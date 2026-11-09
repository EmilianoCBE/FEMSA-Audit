import { findingsService } from "@/features/inbox/services/findingsService";

// Cuando exista la API de hallazgos se cambia esta fuente sin tocar la pantalla
// Por ahora dejamos claro que la bandeja usa datos de ejemplo
export const reportService = { list: findingsService.list };
