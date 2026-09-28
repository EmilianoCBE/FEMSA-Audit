import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { cn } from "@/shared/lib/cn";

const tabClassName = (active: boolean) =>
  cn(
    "-mb-px border-b-2 bg-transparent px-3 py-2 text-body/[normal]",
    active ? "border-accent font-medium text-accent" : "border-transparent text-muted hover:text-ink-2",
  );

function TabCount({ value }: { value?: number }) {
  if (value === undefined) return null;
  return <span className="font-normal text-muted-2"> {value}</span>;
}

function TabList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mt-4 flex gap-0.5 border-b border-line">
      {children}
    </div>
  );
}

export type RouteTab = {
  /** Segmento de ruta relativo a la página (ej. "flow"). */
  path: string;
  label: string;
  count?: number;
};

/** Tabs sincronizados con la URL: cada tab es una ruta hija enlazable. */
export function RouteTabs({ tabs, label }: { tabs: readonly RouteTab[]; label: string }) {
  return (
    <TabList label={label}>
      {tabs.map((tab) => (
        <NavLink key={tab.path} to={tab.path} role="tab" className={({ isActive }) => tabClassName(isActive)}>
          {tab.label}
          <TabCount value={tab.count} />
        </NavLink>
      ))}
    </TabList>
  );
}

export type StateTab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type TabsProps<T extends string> = {
  tabs: readonly StateTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
};

/** Tabs controlados por estado local, para vistas que no necesitan URL propia. */
export function Tabs<T extends string>({ tabs, value, onValueChange, label }: TabsProps<T>) {
  return (
    <TabList label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          onClick={() => onValueChange(tab.id)}
          className={tabClassName(tab.id === value)}
        >
          {tab.label}
          <TabCount value={tab.count} />
        </button>
      ))}
    </TabList>
  );
}
