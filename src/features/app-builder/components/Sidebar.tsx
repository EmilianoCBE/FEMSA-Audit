import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  Inbox,
  LayoutGrid,
  Library,
  Search,
  UserCircle,
} from "lucide-react";
import type { Screen } from "../types";

export function Sidebar({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const appBuilderIsActive = activeScreen === "workflow" || activeScreen === "designer";

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">FEMSA</span>
        <span className="sep" />
        <span className="sys">Auditoría Interna</span>
      </div>
      <div className="searchbox">
        <Search size={12} />
        <input placeholder="Buscar auditorías, hallazgos..." />
      </div>
      <nav>
        <NavGroup label="Gestión de auditoría">
          <NavButton active={activeScreen === "inbox"} icon={<Inbox />} onClick={() => onNavigate("inbox")}>
            Mi bandeja <span className="nav-count">7</span>
          </NavButton>
          <NavButton icon={<Calendar />}>Plan anual</NavButton>
          <NavButton icon={<FileText />}>Auditorías</NavButton>
          <NavButton icon={<AlertTriangle />}>Hallazgos</NavButton>
          <NavButton icon={<CheckSquare />}>Planes de acción</NavButton>
        </NavGroup>

        <NavGroup label="Contenido" owner="Equipo B">
          <NavButton icon={<Library />}>Biblioteca de riesgos</NavButton>
          <NavButton icon={<LayoutGrid />}>Catálogo de controles</NavButton>
          <NavButton icon={<FileText />}>Evidencias</NavButton>
        </NavGroup>

        <NavGroup label="Reportes" owner="Equipo C">
          <NavButton icon={<BarChart3 />}>Tableros</NavButton>
          {/* TODO(US09 - Magda Colunga): agregar exportación de reportes en PDF/Excel con datos legibles. */}
          <NavButton icon={<FileText />}>Reportes ejecutivos</NavButton>
        </NavGroup>

        <NavGroup label="Configuración" owner="Equipo A">
          <NavButton active={appBuilderIsActive} icon={<LayoutGrid />} onClick={() => onNavigate("workflow")}>
            App Builder
          </NavButton>
          <div className="nav-sub">
            <NavButton active={activeScreen === "workflow"} onClick={() => onNavigate("workflow")}>
              Workflow
            </NavButton>
            <NavButton active={activeScreen === "designer"} onClick={() => onNavigate("designer")}>
              Designer
            </NavButton>
          </div>
          {/* TODO(US02 - Karla Alessandra): implementar lista de usuarios, asignación de roles y permisos por módulo. */}
          <NavButton icon={<UserCircle />}>Usuarios y roles</NavButton>
        </NavGroup>
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">AA</div>
        <div>
          <div className="who">Alicia Alemán</div>
          <div className="role">Administrador</div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  owner,
  children,
}: {
  label: string;
  owner?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nav-group">
      <div className="label">
        {label}
        {owner && <span className="owner">{owner}</span>}
      </div>
      {children}
    </div>
  );
}

function NavButton({
  active = false,
  icon,
  onClick,
  children,
}: {
  active?: boolean;
  icon?: React.ReactElement;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`nav-item${active ? " active" : ""}`} onClick={onClick} type="button">
      {icon && <span className="ico">{icon}</span>}
      {children}
    </button>
  );
}
