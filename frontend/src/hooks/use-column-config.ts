import { useState, useEffect, useCallback } from "react";

export interface ColumnConfig {
  key: string;
  label?: string;
  type:
    | "text"
    | "email"
    | "url"
    | "date"
    | "status"
    | "number"
    | "currency"
    | "enum"
    | "boolean"
    | "array"
    | "object"
    | "weekdays";
  sortable: boolean;
  visible: boolean;
  width?: number;
  enumValues?: string[];
  render?: (value: any, row: any) => React.ReactNode;
}

const CACHE_VERSION = "1.2.0"; // Incrementar cuando hay cambios incompatibles

// Limpiar todas las configuraciones de columnas (útil para depuración)
const clearAllColumnConfigs = () => {
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("column-config-"),
    );
    keys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("column-config-version");
  } catch (error) {
    console.error("Error clearing column configs:", error);
  }
};

export function useColumnConfig(modelName: string, defaultColumns: ColumnConfig[]) {
  // El filtrado de arrays y objetos ya se hace en getTableFields, no es necesario aquí
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const savedConfig = localStorage.getItem(`column-config-${modelName}`);
      const cacheVersion = localStorage.getItem("column-config-version");

      // Si la versión del caché es diferente, limpiar todo
      if (cacheVersion !== CACHE_VERSION) {
        localStorage.setItem("column-config-version", CACHE_VERSION);
        return defaultColumns;
      }

      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);

        // Gracefully handle old data structure vs new one.
        // Old: { columns: [...] }
        // New: [...]
        const columnsArray = Array.isArray(parsed) ? parsed : parsed.columns;

        if (Array.isArray(columnsArray) && columnsArray.length > 0) {
          // Validar que las columnas tienen la estructura esperada
          const isValidStructure = columnsArray.every(
            (col) =>
              col &&
              typeof col === "object" &&
              "key" in col &&
              "type" in col &&
              typeof col.visible === "boolean" &&
              typeof col.sortable === "boolean",
          );

          if (isValidStructure) {
            // Crear un mapa de configuración guardada para preservar configuraciones del usuario
            const savedColumnMap = new Map(
              columnsArray.map((col: ColumnConfig) => [col.key, col]),
            );

            // Reconstruir las columnas respetando el orden de defaultColumns
            const mergedColumns = defaultColumns.map((defaultCol) => {
              const savedCol = savedColumnMap.get(defaultCol.key);
              if (savedCol) {
                return {
                  ...defaultCol,
                  visible: savedCol.visible,
                  width: savedCol.width,
                };
              }
              return defaultCol;
            });

            return mergedColumns;
          } else {
            localStorage.removeItem(`column-config-${modelName}`);
          }
        }
      }
    } catch {
      localStorage.removeItem(`column-config-${modelName}`);
    }
    return defaultColumns;
  });

  // Efecto para actualizar columnas cuando cambian las defaultColumns (schema dinámico)
  useEffect(() => {
    if (defaultColumns.length > 0) {
      const defaultKeys = new Set(defaultColumns.map((c) => c.key));
      const currentKeys = new Set(columns.map((c) => c.key));

      // Verificar si hay diferencias significativas
      const hasNewColumns = defaultColumns.some((col) => !currentKeys.has(col.key));
      const hasRemovedColumns = columns.some((col) => !defaultKeys.has(col.key));

      if (hasNewColumns || hasRemovedColumns) {
        try {
          const savedConfig = localStorage.getItem(`column-config-${modelName}`);

          if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            const columnsArray = Array.isArray(parsed) ? parsed : parsed.columns;

            if (Array.isArray(columnsArray)) {
              const savedColumnMap = new Map(
                columnsArray.map((col: ColumnConfig) => [col.key, col]),
              );

              const mergedColumns = defaultColumns.map((defaultCol) => {
                const savedCol = savedColumnMap.get(defaultCol.key);
                if (savedCol) {
                  return {
                    ...defaultCol,
                    visible: savedCol.visible,
                    width: savedCol.width,
                  };
                }
                return defaultCol;
              });

              setColumns(mergedColumns);
            } else {
              setColumns(defaultColumns);
            }
          } else {
            setColumns(defaultColumns);
          }
        } catch {
          setColumns(defaultColumns);
        }
      }
    }
  }, [defaultColumns, modelName]); // Agregar dependencia en defaultColumns

  // Derivar visibleColumns de columns (no como estado separado)
  const visibleColumns = columns.filter((col) => col.visible).map((col) => col.key);

  // Guardar configuración
  const saveConfig = useCallback(
    (newConfig: ColumnConfig[]) => {
      try {
        localStorage.setItem(`column-config-${modelName}`, JSON.stringify(newConfig));
        localStorage.setItem("column-config-version", CACHE_VERSION);
      } catch (err) {
        console.error("Error saving column config:", err);
      }
    },
    [modelName],
  );

  useEffect(() => {
    if (columns.length > 0) {
      saveConfig(columns);
    }
  }, [columns, saveConfig]);

  // Cambiar visibilidad de columna
  const toggleColumnVisibility = (columnKey: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  // Obtener columnas visibles
  const getVisibleColumns = useCallback(() => {
    return columns.filter((col) => col.visible);
  }, [columns]);

  // Resetear configuración
  const resetConfig = () => {
    localStorage.removeItem(`column-config-${modelName}`);
    setColumns(defaultColumns);
  };

  const setColumnOrder = (newOrder: string[]) => {
    setColumns((prevColumns) => {
      try {
        const orderedColumns = newOrder.map((key) => {
          const found = prevColumns.find((c) => c.key === key);
          if (!found) throw new Error(`Column with key ${key} not found`);
          return found;
        });
        const unmanagedColumns = prevColumns.filter((c) => !newOrder.includes(c.key));
        return [...orderedColumns, ...unmanagedColumns];
      } catch {
        return prevColumns;
      }
    });
  };

  return {
    columns,
    visibleColumns,
    getVisibleColumns,
    toggleColumnVisibility,
    setColumnOrder,
    resetConfig,
    clearAllColumnConfigs,
  };
}
