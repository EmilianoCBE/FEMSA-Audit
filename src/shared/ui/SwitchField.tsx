import { Switch } from "./Switch";

type SwitchFieldProps = {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchField({ title, description, checked, onCheckedChange }: SwitchFieldProps) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <div>
        <div className="text-body-sm font-medium">{title}</div>
        {description && <div className="mt-0.5 text-meta/[1.4] text-muted">{description}</div>}
      </div>
      <Switch className="mt-0.5" checked={checked} onCheckedChange={onCheckedChange} label={title} />
    </div>
  );
}
