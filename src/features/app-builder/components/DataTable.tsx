export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="tbl">
      <thead>
        <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("|")}>
            {row.map((cell, index) => (
              <td key={`${cell}-${index}`}>
                {index === row.length - 1 && cell === "Editar" ? <span className="link">{cell}</span> : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

