export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`subtab${active ? " on" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

