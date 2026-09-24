type Tab = { id: string; label: string };

type SubTabsProps = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function SubTabs({ tabs, activeId, onChange }: SubTabsProps) {
  return (
    <div className="subtabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`subtab ${activeId === tab.id ? "on" : ""}`}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
