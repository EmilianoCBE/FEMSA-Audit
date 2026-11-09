// Fechas en la zona horaria del navegador: una versión publicada a las 19:00 en México debe mostrar ese día,
// no el siguiente (en UTC ya sería otro día). `timeZone` solo se pasa en las pruebas.
const dateOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const dateTimeOptions: Intl.DateTimeFormatOptions = {
  ...dateOptions,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const format = (iso: string, options: Intl.DateTimeFormatOptions, timeZone?: string) =>
  new Intl.DateTimeFormat("es-MX", { ...options, timeZone }).format(new Date(iso)).replace(".", "");

/** "2026-08-10T18:30:00.000Z" -> "10 ago 2026"; sin fecha -> "En edición". */
export function formatPublishedAt(publishedAt: string | null, timeZone?: string): string {
  if (!publishedAt) return "En edición";
  return format(publishedAt, dateOptions, timeZone);
}

/** "2026-08-10T18:30:00.000Z" -> "10 ago 2026, 12:30" (en la zona indicada o la del navegador). */
export function formatDateTime(iso: string, timeZone?: string): string {
  return format(iso, dateTimeOptions, timeZone);
}
