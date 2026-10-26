import { Outlet } from "react-router";
import { NAVIGATION } from "../navigation";
import { Sidebar } from "./sidebar/Sidebar";
import { Topbar } from "./topbar/Topbar";

/**
 * Estructura base: sidebar + topbar + contenido de la ruta activa.
 * En escritorio el sidebar y la topbar quedan fijos y solo hace scroll el contenido (data-app-scroll).
 */
export function AppLayout() {
  return (
    <div className="app-shell mx-auto grid min-h-screen grid-cols-1 border-x border-line bg-surface desktop:h-screen desktop:max-w-[1280px] desktop:grid-cols-[238px_1fr] desktop:grid-rows-1 desktop:overflow-hidden">
      <Sidebar sections={NAVIGATION} />
      <main className="app-main flex min-w-0 flex-col desktop:min-h-0">
        <Topbar />
        <div data-app-scroll className="flex flex-1 flex-col desktop:block desktop:min-h-0 desktop:overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
