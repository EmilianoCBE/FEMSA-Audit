import { Outlet } from "react-router";
import { NAVIGATION } from "../navigation";
import { Sidebar } from "./sidebar/Sidebar";
import { Topbar } from "./topbar/Topbar";

/** Estructura base: sidebar + topbar + contenido de la ruta activa. */
export function AppLayout() {
  return (
    <div className="mx-auto grid min-h-screen grid-cols-1 border-x border-line bg-surface desktop:max-w-[1280px] desktop:grid-cols-[238px_1fr]">
      <Sidebar sections={NAVIGATION} />
      <main className="flex min-w-0 flex-col">
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
