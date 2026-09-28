import { useBreadcrumb } from "@/shared/routing/handle";
import { Badge, Button } from "@/shared/ui";
import { Breadcrumbs } from "./Breadcrumbs";

export function Topbar() {
  const breadcrumb = useBreadcrumb();

  return (
    <div className="app-topbar flex h-[52px] flex-none items-center gap-3 border-b border-line px-4 desktop:px-6">
      <Breadcrumbs items={breadcrumb} />
      <div className="ml-auto flex items-center gap-2">
        <Badge tone="amber" size="sm">Borrador · v4</Badge>
        {/* TODO(US08 - Leonel): abrir preview responsivo con modos Desktop, Tablet y Mobile. */}
        <Button>Vista previa</Button>
        {/* TODO(US10 - Juan Aguilar): guardar/reabrir Draft y evitar que aparezca como aplicación publicada. */}
        <Button variant="primary">Publicar</Button>
      </div>
    </div>
  );
}
