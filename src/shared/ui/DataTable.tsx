import type { CSSProperties, Key, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type DataTableColumn<T> = {
  id: string;
  /** Texto de encabezado; vacío para columnas de acciones. */
  header?: ReactNode;
  width?: CSSProperties["width"];
  align?: "left" | "center";
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => Key;
  className?: string;
};

const alignClassName = { left: "text-left", center: "text-center" } as const;

/**
 * Tabla genérica: la estructura (columnas) se declara fuera y cada columna decide cómo
 * renderizar su celda. Agregar una columna no requiere modificar este componente.
 */
export function DataTable<T>({ columns, rows, getRowKey, className }: DataTableProps<T>) {
  return (
    <table
      className={cn(
        "responsive-table w-full border-collapse overflow-hidden rounded-md border border-line bg-surface",
        className,
      )}
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.id}
              style={{ width: column.width }}
              className={cn(
                "border-b border-line bg-nav px-3.5 py-[9px] text-label font-semibold tracking-[.03em] text-muted uppercase",
                alignClassName[column.align ?? "left"],
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="[&>tr:last-child>td]:border-b-0">
        {rows.map((row) => (
          <tr key={getRowKey(row)} className="hover:bg-row-hover">
            {columns.map((column) => (
              <td
                key={column.id}
                className={cn(
                  "border-b border-line px-3.5 py-[11px] align-middle text-body",
                  alignClassName[column.align ?? "left"],
                  column.className,
                )}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
