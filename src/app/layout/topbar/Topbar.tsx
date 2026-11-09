import { useBreadcrumb } from "@/shared/routing/handle";
import { Breadcrumbs } from "./Breadcrumbs";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export function Topbar() {
  const breadcrumb = useBreadcrumb();

  return (
    <div className="app-topbar flex h-[52px] flex-none items-center gap-3 border-b border-line px-4 desktop:px-6">
      <Breadcrumbs items={breadcrumb} />
      <div className="ml-auto flex items-center gap-2">
        <div className="desktop:hidden">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
