import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getVisibleModels } from "../../../../shared/models-config.ts";
import * as Icons from "lucide-react";
import { SidebarFooter } from "../ui/layout/sidebar";

interface DynamicSidebarProps {
  className?: string;
  sidebarOpen: boolean;
  onSectionChange?: () => void;
}

// Helper para obtener el ícono de Lucide React
function getIcon(iconName: string) {
  const IconComponent = (Icons as any)[iconName] || Icons.Circle;
  return IconComponent;
}

export function DynamicSidebar({
  className,
  sidebarOpen,
  onSectionChange,
}: DynamicSidebarProps) {
  const location = useLocation();
  const visibleModels = getVisibleModels();

  // Elementos estáticos del sidebar
  const staticItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "LayoutDashboard",
      path: "/dashboard",
    },
  ];

  // Generar items dinámicos para cada modelo
  const modelItems = visibleModels.map((model) => ({
    id: model.name,
    name: model.ui.pluralName || `${model.ui.displayName}s`,
    icon: model.ui.icon || "Circle",
    path: `/${model.name}`,
    group: model.ui.group,
  }));

  // Ya no agrupamos los modelos, se muestran todos en una lista

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname === path;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 mt-4 overflow-hidden flex flex-col">
        {/* Mantener el espacio de NAVIGATION siempre para evitar salto vertical */}
        <div className="h-6 mb-4 flex items-center px-4">
          <div
            className={`text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap pointer-events-none transition-all duration-300 ${
              sidebarOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0 overflow-hidden"
            }`}
            style={{ transitionProperty: "opacity, max-width" }}
          >
            Navigation
          </div>
        </div>

        <div className={`flex-1 ${!sidebarOpen ? "px-2" : "px-4"}`}>
          <div className="space-y-1">
            {/* Dashboard */}
            {staticItems.map((item) => {
              const IconComponent = getIcon(item.icon);
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => onSectionChange?.()}
                  className={`
                    w-full h-10 flex items-center gap-3 px-3 rounded-md text-left transition-all duration-200
                    ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`font-medium whitespace-nowrap transition-all duration-300 ${
                      sidebarOpen
                        ? "opacity-100 max-w-xs"
                        : "opacity-0 max-w-0 overflow-hidden"
                    }`}
                    style={{ transitionProperty: "opacity, max-width" }}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* Separador entre Dashboard y Modelos */}
            {modelItems.length > 0 && (
              <div className={`py-2 ${!sidebarOpen ? "px-2" : ""}`}>
                <div className="border-t border-border"></div>
              </div>
            )}

            {/* Todos los modelos sin agrupación */}
            {modelItems.map((item) => {
              const IconComponent = getIcon(item.icon);
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => onSectionChange?.()}
                  className={`
                    w-full h-10 flex items-center gap-3 px-3 rounded-md text-left transition-all duration-200
                    ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`font-medium whitespace-nowrap transition-all duration-300 ${
                      sidebarOpen
                        ? "opacity-100 max-w-xs"
                        : "opacity-0 max-w-0 overflow-hidden"
                    }`}
                    style={{ transitionProperty: "opacity, max-width" }}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer con línea divisoria consistente */}
      <SidebarFooter>
        <div
          className={`text-xs whitespace-nowrap max-w-xs min-w-0 overflow-hidden transition-all duration-300 ${
            sidebarOpen
              ? "opacity-100 text-center text-muted-foreground/70"
              : "opacity-0 max-w-0 text-muted-foreground"
          }`}
          style={{ transitionProperty: "opacity, max-width" }}
        >
          SaveApp Admin v1.0
        </div>
      </SidebarFooter>
    </div>
  );
}
