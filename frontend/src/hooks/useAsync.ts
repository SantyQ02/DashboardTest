import { useState, useEffect, useCallback } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = { immediate: true },
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, deps);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    ...state,
    execute,
  };
}

// Hook específico para operaciones CRUD
export function useCrudOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      setLoading(false);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error en la operación";
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
}

// Hook para limpiar diálogos y prevenir bloqueo de UI
export function useDialogCleanup() {
  const cleanup = useCallback(() => {
    // Remover cualquier overlay o backdrop que pueda estar bloqueando la UI
    const overlays = document.querySelectorAll("[data-radix-portal]");
    overlays.forEach((overlay) => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });

    // Limpiar estilos del body que puedan estar bloqueando scroll
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";

    // Remover cualquier atributo de aria que pueda estar causando problemas
    document.body.removeAttribute("aria-hidden");
    document.body.removeAttribute("data-scroll-locked");
  }, []);

  useEffect(() => {
    // Cleanup al desmontar el componente
    return cleanup;
  }, [cleanup]);

  return cleanup;
}
