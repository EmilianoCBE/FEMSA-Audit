import { cn } from "@/shared/lib/cn";

type AvatarProps = {
  initials: string;
  className?: string;
};

export function Avatar({ initials, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex size-[26px] flex-none items-center justify-center rounded-full bg-avatar text-label font-semibold text-ink-2",
        className,
      )}
    >
      {initials}
    </div>
  );
}
