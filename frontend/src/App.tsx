// Panel de administración SaveApp - Estilo shadcn/ui con modo oscuro
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AutoRouter } from "./components/features/AutoRouter";
import { DynamicSidebar } from "./components/features/DynamicSidebar";
import { LoginForm } from "./components/login-form";
import { useAuth } from "./hooks/use-auth";
import { useIsMobile } from "./hooks/use-mobile";
import { useSessionCheck } from "./hooks/use-session-check";
import {
  BarChart3,
  LogOut,
  ChevronLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/base/dropdown-menu";
import { Toaster } from "sonner";

function App() {
  const { user, loading, error, login, logout, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start open by default
  const [isDark, setIsDark] = useState(false);

  // Verificar sesión activamente
  useSessionCheck();

  // Auto close sidebar on mobile and manage initial state
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      // On desktop, sidebar should always start open by default
      const savedSidebarState = localStorage.getItem("sidebar-open");
      setSidebarOpen(savedSidebarState !== null ? JSON.parse(savedSidebarState) : true);
    }
  }, [isMobile]);

  // Save sidebar state on desktop
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebar-open", JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen, isMobile]);

  // Cargar tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);

    // Load saved dashboard layout
    const layout = localStorage.getItem("dashboard-layout");
    if (layout) {
      try {
        JSON.parse(layout); // Just validate, no need to store
      } catch {
        console.warn("Invalid dashboard layout in localStorage, clearing...");
        localStorage.removeItem("dashboard-layout");
      }
    }

    // Limpiar cachés corruptos o antiguos al iniciar la aplicación
    clearCorruptedCaches();
  }, []);

  // Función para limpiar cachés corruptos
  const clearCorruptedCaches = () => {
    try {
      // Limpiar configuraciones de columnas corruptas
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("column-config-")) {
          try {
            const config = JSON.parse(localStorage.getItem(key) || "{}");
            // Verificar si la estructura es válida
            if (
              !Array.isArray(config) &&
              (!config.columns || !Array.isArray(config.columns))
            ) {
              console.warn(`Clearing corrupted column config: ${key}`);
              localStorage.removeItem(key);
            }
          } catch {
            console.warn(`Clearing corrupted column config: ${key}`);
            localStorage.removeItem(key);
          }
        }

        // Limpiar otros cachés problemáticos
        if (key.includes("react-grid-layout") || key.includes("old-version")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error cleaning corrupted caches:", error);
    }
  };

  // Función global para limpiar todos los cachés (disponible en consola)
  const clearAllCaches = () => {
    try {
      console.log("🧹 Clearing all application caches...");

      // Limpiar localStorage completamente
      const keysToKeep = ["theme"]; // Mantener solo el tema
      const allKeys = Object.keys(localStorage);

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Limpiar sessionStorage
      sessionStorage.clear();

      console.log("✅ All caches cleared successfully!");
      console.log("🔄 Please refresh the page to see changes.");

      // Opcional: recargar la página automáticamente
      // window.location.reload()
    } catch (error) {
      console.error("❌ Error clearing caches:", error);
    }
  };

  // Exponer función de limpieza en la consola del navegador para debugging
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).clearAllCaches = clearAllCaches;
      console.log("🛠️ Debug function available: clearAllCaches()");
    }
  }, []);

  // Alternar tema
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  // Layout change handler removed as it's now handled in DashboardContent

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSectionChange = () => {
    closeSidebar(); // Close sidebar on mobile when navigating
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-3xl mb-4 mx-auto animate-pulse">
            S
          </div>
          <p className="text-lg font-bold text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center text-destructive-foreground font-bold text-lg mb-4 mx-auto">
            !
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <LoginForm onLogin={handleLogin} loading={loading} error={error} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          {/* Overlay para móvil */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeSidebar}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              ${isMobile ? "fixed inset-y-0 left-0 z-50" : "relative z-50"}
              ${isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
              ${isMobile && sidebarOpen ? "w-64" : sidebarOpen ? "w-64" : "w-16"}
              transition-all duration-300 ease-in-out
              bg-card border-r border-border flex flex-col
            `}
          >
            {/* Sidebar Header */}
            <div className="border-b-2 border-border p-4 flex-shrink-0 relative">
              <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
                  S
                </div>
                <div
                  className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    sidebarOpen || isMobile
                      ? "opacity-100 max-w-xs"
                      : "opacity-0 max-w-0"
                  }`}
                  style={{ transitionProperty: "opacity, max-width" }}
                >
                  <h1 className="text-xl font-bold text-foreground text-center">
                    SaveApp
                  </h1>
                  <p className="text-sm text-muted-foreground/70 text-center">
                    Admin Panel
                  </p>
                </div>
                {/* Botón de cerrar en móvil */}
                {isMobile && (
                  <button
                    onClick={closeSidebar}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-md hover:bg-accent transition-colors"
                    aria-label="Close sidebar"
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Botón de collapse/expand flotante en desktop - posicionado en la línea del borde */}
              {!isMobile && (
                <div className="absolute -right-4 bottom-0 transform translate-y-1/2 z-[70]">
                  <button
                    onClick={toggleSidebar}
                    className={`
                      w-8 h-8 
                      bg-white dark:bg-gray-900 
                      border-2 border-gray-200 dark:border-gray-700 
                      rounded-full 
                      flex items-center justify-center
                      hover:bg-gray-50 dark:hover:bg-gray-800 
                      hover:shadow-lg hover:scale-105
                      transition-all duration-300
                      shadow-lg
                    `}
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                  >
                    <div
                      className={`transition-transform duration-300 ${sidebarOpen ? "rotate-0" : "rotate-180"}`}
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Sidebar Content */}
            <DynamicSidebar
              sidebarOpen={sidebarOpen || isMobile}
              onSectionChange={handleSectionChange}
              className="flex-1"
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-card relative z-30 flex-shrink-0">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Mobile menu button */}
                  {isMobile && (
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-md hover:bg-accent transition-colors"
                      aria-label="Open sidebar"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Header simplificado sin texto */}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium border-2 border-border hover:bg-accent hover:shadow-lg hover:scale-105 hover:border-primary transition-all duration-200">
                        {user?.email?.charAt(0).toUpperCase() || "A"}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <p className="text-sm font-medium leading-none">
                              User Profile
                            </p>
                          </div>
                          <p className="text-xs leading-none text-muted-foreground">
                            Signed in as admin
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {user?.email || "admin@saveapp.com"}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Shield className="w-4 h-4 mr-2" />
                        <span className="text-sm">Administrator</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          Since: {new Date().toLocaleDateString()}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleTheme();
                        }}
                        className="cursor-pointer"
                      >
                        {isDark ? (
                          <Sun className="w-4 h-4 mr-2 transition-all duration-300" />
                        ) : (
                          <Moon className="w-4 h-4 mr-2 transition-all duration-300" />
                        )}
                        <span>Theme</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              <AutoRouter />
            </main>
          </div>
        </div>
      </div>
      {/* Toaster para notificaciones globales */}
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
