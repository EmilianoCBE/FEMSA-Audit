type SwitchProps = {
  checked?: boolean;
  compact?: boolean;
  onClick?: () => void;
};

export function Switch({ checked = false, compact = false, onClick }: SwitchProps) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      className={`${compact ? "sw-sm" : "sw"} ${checked ? "on" : ""}`}
      onClick={onClick}
    />
  );
}
