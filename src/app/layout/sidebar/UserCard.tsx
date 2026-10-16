import { useCurrentUser } from "@/features/auth";
import { Avatar } from "@/shared/ui";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export function UserCard() {
  const user = useCurrentUser();
  return (
    <div className="flex items-center gap-[9px] border-t border-line px-4 py-[11px]">
      <Avatar initials={user.initials} />
      <div className="min-w-0 flex-1">
        <div className="text-control/[1.25] font-medium">{user.name}</div>
        <div className="text-label/[1.25] text-muted">{user.role}</div>
      </div>
      <LogoutButton />
    </div>
  );
}
