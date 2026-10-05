import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  Inbox,
  LayoutGrid,
  Library,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/routing/routes";

export type NavItem = {
  label: string;
  icon?: LucideIcon;
  /** Ruta destino. Sin `to`, el módulo aún no está implementado. */
  to?: string;
  count?: number;
  children?: readonly NavItem[];
};

export type NavSection = {
  label: string;
  /** Equipo responsable del módulo. */
  owner?: string;
  items: readonly NavItem[];
};

/**
 * Menú lateral declarativo: para agregar un módulo basta con registrar aquí su entrada;
 * el Sidebar no necesita modificarse.
 */
export const NAVIGATION: readonly NavSection[] = [
  {
    label: "Gestión de auditoría",
    items: [
      // TODO: obtener el conteo desde el servicio de bandeja cuando exista.
      { label: "Mi bandeja", icon: Inbox, to: ROUTES.inbox, count: 7 },
      { label: "Plan anual", icon: Calendar },
      { label: "Auditorías", icon: FileText },
      { label: "Hallazgos", icon: AlertTriangle },
      { label: "Planes de acción", icon: CheckSquare },
    ],
  },
  {
    label: "Contenido",
    owner: "Equipo B",
    items: [
      { label: "Biblioteca de riesgos", icon: Library },
      { label: "Catálogo de controles", icon: LayoutGrid },
      { label: "Evidencias", icon: FileText },
    ],
  },
  {
    label: "Reportes",
    owner: "Equipo C",
    items: [
      { label: "Tableros", icon: BarChart3 },
      // TODO(US09 - Magda Colunga): agregar exportación de reportes en PDF/Excel con datos legibles.
      { label: "Reportes ejecutivos", icon: FileText },
    ],
  },
  {
    label: "Configuración",
    owner: "Equipo A",
    items: [
      {
        label: "App Builder",
        icon: LayoutGrid,
        to: ROUTES.appBuilder.root,
        children: [
          { label: "Workflow", to: ROUTES.appBuilder.workflow },
          { label: "Designer", to: ROUTES.appBuilder.designer },
        ],
      },
      {
        label: "Usuarios y roles",
        icon: UserCircle,
        to: "/users",
      },
    ],
  },
];
