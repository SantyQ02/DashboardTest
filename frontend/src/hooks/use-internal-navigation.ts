import { useCallback } from "react";

interface NavigationOptions {
  replace?: boolean;
  state?: any;
}

export function useInternalNavigation() {
  const navigate = useCallback((url: string, options: NavigationOptions = {}) => {
    const { replace = false, state = {} } = options;

    if (replace) {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
    }

    // Disparar evento personalizado para notificar el cambio
    window.dispatchEvent(
      new CustomEvent("internalNavigation", {
        detail: { url, state, replace },
      }),
    );
  }, []);

  const navigateToNestedModal = useCallback(
    (baseUrl: string, nestedPath: string, delay: number = 100) => {
      // Primero navegar a la URL base para abrir el modal
      navigate(baseUrl);

      // Luego navegar al path anidado después de un delay más largo
      // para asegurar que el modal se haya abierto completamente
      setTimeout(() => {
        const nestedUrl = `${baseUrl}/${nestedPath}`;
        navigate(nestedUrl);
      }, delay);
    },
    [navigate],
  );

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  return {
    navigate,
    navigateToNestedModal,
    goBack,
    goForward,
  };
}
