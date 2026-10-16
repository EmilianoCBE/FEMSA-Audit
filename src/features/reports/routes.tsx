import type { RouteObject } from "react-router";
import { ReportsPage } from "./ReportsPage";
import { REPORT_PATH } from "./reportModel";

export const reportRoutes: RouteObject[] = [
  {
    path: REPORT_PATH,
    element: <ReportsPage />,
    handle: { breadcrumb: ["Reportes", "Reportes ejecutivos"] },
  },
];
