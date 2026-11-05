import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { httpClient } from "@/shared/api/httpClient";
import { Button } from "@/shared/ui";

export type ModuleId = "app-builder" | "risks" | "reports";
export type AccessLevel = "edit" | "read" | "hidden";
type Access = { permissions: Record<ModuleId, AccessLevel>; canManagePermissions: boolean };
const Context = createContext<(Access & { refresh: () => Promise<void> }) | null>(null);
export function moduleForPath(path: string): ModuleId | undefined {
  if (path.startsWith("/app-builder")) return "app-builder";
  if (path.startsWith("/riesgos")) return "risks";
  if (path.startsWith("/reportes")) return "reports";
}
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access>();
  const [error, setError] = useState<string>();
  const refresh = useCallback(async () => {
    try {
      const result = await httpClient.get<Access>("/permissions/me");
      setAccess(result);
      setError(undefined);
    } catch (err) {
      setAccess(undefined);
      setError(err instanceof Error ? err.message : "No se pudieron cargar los permisos.");
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);
  if (error)
    return (
      <div role="alert" className="p-6">
        {error}
        <Button onClick={() => void refresh()}>Reintentar</Button>
      </div>
    );
  if (!access)
    return (
      <p role="status" className="p-6">
        Cargando permisos…
      </p>
    );
  return <Context.Provider value={{ ...access, refresh }}>{children}</Context.Provider>;
}
export function usePermissions() {
  const value = useContext(Context);
  if (!value) throw new Error("PermissionsProvider no está disponible.");
  return value;
}
export function ModuleAccess({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const access = usePermissions();
  const moduleId = moduleForPath(pathname);
  const managingPermissions = /^\/app-builder\/designer\/permissions\/?$/.test(pathname);
  if (
    (managingPermissions && !access.canManagePermissions) ||
    (moduleId && access.permissions[moduleId] === "hidden")
  ) {
    return (
      <p role="alert" className="p-6">
        Tu rol no tiene acceso a esta sección.
      </p>
    );
  }
  return (
    <>
      {moduleId && access.permissions[moduleId] === "read" && (
        <p role="status" className="px-6 py-2 text-sm text-muted">
          Acceso de solo lectura. Tu rol no puede guardar cambios en este módulo.
        </p>
      )}
      {children}
    </>
  );
}
