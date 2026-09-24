import { DataTable } from "./DataTable";

export function ContentTable({
  title,
  button,
  headers,
  rows,
}: {
  title: string;
  button?: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="panel active">
      <div className="content-area">
        <div className="area-head">
          <div className="txt">{title}</div>
          {button && <button className="btn primary" type="button">{button}</button>}
        </div>
        <DataTable headers={headers} rows={rows} />
      </div>
    </div>
  );
}

