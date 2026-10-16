const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-08-10T00:00:00.000Z" -> "10 ago 2026"; sin fecha -> "En edición". */
export function formatPublishedAt(publishedAt: string | null): string {
  if (!publishedAt) return "En edición";
  return dateFormatter.format(new Date(publishedAt)).replace(".", "");
}
