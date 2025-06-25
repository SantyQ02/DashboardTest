import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { auth } from "../lib/firebase";
import { authService } from "../services/auth";

// Hook para verificar activamente la sesión
export function useSessionCheck() {
  const { user, logout } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Verificar sesión cada 10 minutos (menos agresivo)
    const checkSession = async () => {
      try {
        // Obtener el token almacenado
        const storedToken = localStorage.getItem("auth-token");
        if (!storedToken) {
          console.warn("No stored token found, logging out");
          logout();
          return;
        }

        // Verificar si el usuario de Firebase está autenticado
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          console.warn("No Firebase user found, logging out");
          logout();
          return;
        }

        // Obtener token fresco de Firebase
        const idToken = await firebaseUser.getIdToken(false);

        // Verificar token con el backend
        const response = await authService.verify(idToken);

        if (!response.success) {
          console.warn("Backend session verification failed, logging out");
          logout();
          return;
        }

        // Actualizar token almacenado si es diferente
        if (idToken !== storedToken) {
          localStorage.setItem("auth-token", idToken);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        // Solo hacer logout si es un error de autenticación, no errores de red
        if (
          error instanceof Error &&
          (error.message.includes("auth") ||
            error.message.includes("token") ||
            error.message.includes("401") ||
            error.message.includes("403"))
        ) {
          logout();
        }
      }
    };

    // Configurar verificación periódica (sin verificar inmediatamente)
    intervalRef.current = setInterval(checkSession, 10 * 60 * 1000); // Cada 10 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, logout]);

  // Verificar cuando la ventana vuelve a tener foco (menos agresivo)
  useEffect(() => {
    const handleFocus = async () => {
      if (!user) return;

      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;

        const idToken = await firebaseUser.getIdToken(false);
        const response = await authService.verify(idToken);

        if (!response.success) {
          logout();
        }
      } catch (error) {
        console.error("Focus session check failed:", error);
        // Solo hacer logout si es claramente un error de autenticación
        if (error instanceof Error && error.message.includes("401")) {
          logout();
        }
      }
    };

    // Debounce para evitar múltiples verificaciones rápidas
    let focusTimeout: NodeJS.Timeout;
    const debouncedHandleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(handleFocus, 1000); // Esperar 1 segundo
    };

    window.addEventListener("focus", debouncedHandleFocus);
    return () => {
      window.removeEventListener("focus", debouncedHandleFocus);
      clearTimeout(focusTimeout);
    };
  }, [user, logout]);
}
