import { useState, useEffect, useCallback } from "react";
import { CrudTable } from "../crud-table";
import { DynamicForm } from "../dynamic-form";
import { RecordDetailView } from "../record-detail-view";
import { useColumnConfig } from "../../hooks/use-column-config";
import { genericApi } from "../../services/api";
import { schemaService, type ModelSchema } from "../../services/schema";
import {
  getModelConfig,
  isFeatureEnabled,
  type ModelConfig,
  collections,
} from "../../../../shared/models-config.ts";
import { useParams, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/layout/dialog";
import { Button } from "../ui/base/button";
import { toast } from "sonner";
import { Trash, RotateCcw } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import React from "react";

interface GenericCrudViewProps {
  modelName: string;
  customConfig?: Partial<ModelConfig>;
  className?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}

// Variante de DialogContent sin crucecita
const DialogContentNoClose = React.forwardRef(
  ({ className, children, ...props }: any, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-modal-fade-in data-[state=closed]:animate-modal-fade-out" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "bg-background fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg data-[state=open]:animate-modal-scale-in data-[state=closed]:animate-modal-scale-out",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DialogContentNoClose.displayName = "DialogContentNoClose";

export function GenericCrudView({
  modelName,
  customConfig,
  className,
}: GenericCrudViewProps) {
  // Estados (deben ir antes de cualquier return)
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<ModelSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [currentSort, setCurrentSort] = useState<SortState | null>({
    key: "createdAt",
    direction: "desc",
  });
  const [isViewingTrash, setIsViewingTrash] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  // Estados para formularios
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estado para dialog de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "delete" | "restore" | null;
    item: any;
  }>({ open: false, action: null, item: null });
  const [actionLoading, setActionLoading] = useState(false);

  const params = useParams();
  const navigate = useNavigate();

  // Obtener el path anidado de la URL (splat parameter)
  const nestedPath = params["*"];
  const recordId = params["id"];

  // Obtener configuración del modelo
  const baseConfig = getModelConfig(modelName);
  const config = customConfig ? { ...baseConfig, ...customConfig } : baseConfig;

  // Validar que tenemos los campos requeridos
  const modelName_safe = config?.name || modelName;
  const displayName = config?.displayName || modelName;
  const pluralName = config?.pluralName || `${modelName}s`;
  const uiConfig = config?.ui || {
    icon: "Database",
    description: `Manage ${pluralName.toLowerCase()}`,
    displayName,
    pluralName,
  };

  // Obtener el collectionName plural para pasar a CrudTable
  const collectionInfo = Object.values(collections).find(
    (col) => col.modelName.toLowerCase() === modelName_safe.toLowerCase(),
  );
  const collectionNamePlural = collectionInfo?.collectionName || modelName_safe;

  // Función para obtener schema
  const fetchSchema = useCallback(async () => {
    try {
      setSchemaLoading(true);
      setError(null);

      const modelSchema = await schemaService.getModelSchema(modelName_safe);
      setSchema(modelSchema);
      setSchemaLoading(false);
    } catch {
      setError("Failed to fetch schema");
      setSchemaLoading(false);
    }
  }, [modelName_safe]);

  // Configuración de columnas por defecto (fallback)
  const fallbackColumns = [
    {
      key: "name",
      type: "text" as const,
      sortable: true,
      visible: true,
      label: "Name",
      required: false,
    },
    {
      key: "createdAt",
      type: "date" as const,
      sortable: true,
      visible: true,
      label: "Created At",
      required: false,
    },
    {
      key: "updatedAt",
      type: "date" as const,
      sortable: true,
      visible: false,
      label: "Updated At",
      required: false,
    },
  ];

  // Configuración de columnas basada en schema - usamos getTableFields para campos apropiados para tabla
  const defaultColumns = schema
    ? schemaService.fieldsToColumns(schemaService.getTableFields(schema))
    : fallbackColumns;

  // Configuración de columnas
  const {
    columns: configuredColumns,
    visibleColumns,
    toggleColumnVisibility,
    setColumnOrder,
    resetConfig,
  } = useColumnConfig(modelName_safe, defaultColumns);

  // Función helper para recargar datos
  const reloadData = useCallback(
    async (page?: number, search?: string) => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: page || pagination?.page || 1,
          limit: pagination?.limit || 10,
        };

        if (search && isFeatureEnabled(modelName_safe, "search")) {
          params.search = search;
        }
        if (currentSort?.key) params.sort = currentSort.key;
        if (currentSort?.direction) params.order = currentSort.direction;

        const response = isViewingTrash
          ? await genericApi.getDeleted(modelName_safe, params)
          : await genericApi.getAll(modelName_safe, params);

        setData(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
        setLoading(false);
      } catch {
        setError("Failed to fetch data");
        setLoading(false);
      }
    },
    [modelName_safe, isViewingTrash, pagination?.page, pagination?.limit, currentSort],
  );

  // Función para obtener datos
  const fetchData = useCallback(
    async (
      page = 1,
      limit = 10,
      search?: string,
      sortBy?: string,
      sortOrder?: "asc" | "desc",
      additionalFilters: any = {},
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page,
          limit,
          ...additionalFilters,
        };

        if (search && isFeatureEnabled(modelName_safe, "search")) {
          params.search = search;
        }
        if (sortBy) params.sort = sortBy;
        if (sortOrder) params.order = sortOrder;

        const response = isViewingTrash
          ? await genericApi.getDeleted(modelName_safe, params)
          : await genericApi.getAll(modelName_safe, params);

        setData(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
        setLoading(false);
      } catch {
        setError("Failed to fetch data");
        setLoading(false);
      }
    },
    [modelName_safe, isViewingTrash],
  );

  // Función para obtener conteo de papelera
  const fetchTrashCount = useCallback(async () => {
    if (!isFeatureEnabled(modelName_safe, "viewTrash")) return;

    try {
      const response = await genericApi.getDeleted(modelName_safe, {
        page: 1,
        limit: 1,
      });
      setTrashCount(response.total || 0);
    } catch {
      setTrashCount(0);
    }
  }, [modelName_safe]);

  // Cargar schema al montar el componente
  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // Cargar schema y datos iniciales SOLO una vez cuando cambia el schema
  useEffect(() => {
    if (schema) {
      // Usar función interna para evitar dependencias circulares
      const loadInitialData = async () => {
        try {
          setLoading(true);
          setError(null);

          const params: any = {
            page: 1,
            limit: 10,
          };

          // Usar valores actuales sin depender de dependencias
          const currentSortValue = currentSort;
          const isViewingTrashValue = isViewingTrash;
          const modelNameSafeValue = modelName_safe;

          if (currentSortValue?.key) params.sort = currentSortValue.key;
          if (currentSortValue?.direction) params.order = currentSortValue.direction;

          const response = isViewingTrashValue
            ? await genericApi.getDeleted(modelNameSafeValue, params)
            : await genericApi.getAll(modelNameSafeValue, params);

          setData(response.data || []);
          setPagination({
            page: response.page || 1,
            limit: response.limit || 10,
            total: response.total || 0,
            totalPages: response.totalPages || 0,
          });
          setLoading(false);
        } catch {
          setError("Failed to fetch data");
          setLoading(false);
        }
      };

      const loadTrashCount = async () => {
        if (!isFeatureEnabled(modelName_safe, "viewTrash")) return;

        try {
          const response = await genericApi.getDeleted(modelName_safe, {
            page: 1,
            limit: 1,
          });
          setTrashCount(response.total || 0);
        } catch {
          setTrashCount(0);
        }
      };

      loadInitialData();
      loadTrashCount();
    }
    // Solo depende de schema
  }, [schema]);

  // Cargar record específico cuando hay un ID en la URL
  const loadSpecificRecordInternal = useCallback(
    async (recordIdToLoad?: string) => {
      const targetRecordId = recordIdToLoad || recordId;
      if (!targetRecordId || !schema) return;

      try {
        // Solo mostrar loading si no tenemos datos cargados
        if (data.length === 0) {
          setLoading(true);
        }
        setError(null);

        const record = await genericApi.getById(modelName_safe, targetRecordId);
        setSelectedRecord(record);
      } catch {
        setError(`Failed to load record ${targetRecordId}`);
      } finally {
        setLoading(false);
      }
    },
    [recordId, schema, data.length, modelName_safe],
  );

  useEffect(() => {
    if (recordId && schema) {
      loadSpecificRecordInternal();
    }
    // Solo depende de recordId y schema
  }, [recordId, schema, loadSpecificRecordInternal]);

  // Recargar datos cuando cambia isViewingTrash
  useEffect(() => {
    if (schema) {
      const reloadDataForTrash = async () => {
        try {
          setLoading(true);
          setError(null);

          const params: any = {
            page: pagination?.page || 1,
            limit: pagination?.limit || 10,
          };

          // Usar valores actuales sin depender de dependencias
          const currentSortValue = currentSort;
          const isViewingTrashValue = isViewingTrash;
          const modelNameSafeValue = modelName_safe;

          if (currentSortValue?.key) params.sort = currentSortValue.key;
          if (currentSortValue?.direction) params.order = currentSortValue.direction;

          const response = isViewingTrashValue
            ? await genericApi.getDeleted(modelNameSafeValue, params)
            : await genericApi.getAll(modelNameSafeValue, params);

          setData(response.data || []);
          setPagination({
            page: response.page || 1,
            limit: response.limit || 10,
            total: response.total || 0,
            totalPages: response.totalPages || 0,
          });
          setLoading(false);
        } catch {
          setError("Failed to fetch data");
          setLoading(false);
        }
      };

      reloadDataForTrash();
    }
  }, [isViewingTrash]);

  // Handlers
  const handleAdd = () => {
    if (!isFeatureEnabled(modelName_safe, "create")) return;
    setSelectedRecord(null);
    setShowCreateForm(true);
  };

  const handleEdit = (item: any) => {
    if (!isFeatureEnabled(modelName_safe, "update")) return;
    setSelectedRecord(item);
    setShowEditForm(true);
  };

  const handleDelete = (item: any) => {
    if (!isFeatureEnabled(modelName_safe, "delete")) return;
    setConfirmDialog({ open: true, action: "delete", item });
  };

  const handleRestore = (item: any) => {
    if (!isFeatureEnabled(modelName_safe, "restore")) return;
    setConfirmDialog({ open: true, action: "restore", item });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.item || !confirmDialog.action) return;
    setActionLoading(true);
    try {
      if (confirmDialog.action === "delete") {
        await genericApi.delete(
          modelName_safe,
          confirmDialog.item.id || confirmDialog.item._id,
        );
        toast.success(`${displayName} deleted successfully`, {
          icon: <Trash className="text-destructive" />,
        });
      } else if (confirmDialog.action === "restore") {
        await genericApi.restore(
          modelName_safe,
          confirmDialog.item.id || confirmDialog.item._id,
        );
        toast.success(`${displayName} restored successfully`, {
          icon: <RotateCcw className="text-green-600" />,
        });
      }

      reloadData();
      fetchTrashCount();
      setConfirmDialog({ open: false, action: null, item: null });
    } catch {
      toast.error(
        confirmDialog.action === "delete"
          ? `Failed to delete ${displayName.toLowerCase()}`
          : `Failed to restore ${displayName.toLowerCase()}`,
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Al abrir detalles, navegar a /modelo/:id
  const handleView = (item: any) => {
    navigate(`/${modelName}/${item.id || item._id}`);
  };

  // Al cerrar detalles, volver a /modelo
  const handleCloseDetail = () => {
    navigate(`/${modelName}`);
    setTimeout(() => setSelectedRecord(null), 100);
  };

  const handlePageChange = (page: number) => {
    reloadData(page);
  };

  const handleSearch = useCallback(
    (search: string) => {
      if (!isFeatureEnabled(modelName_safe, "search")) return;
      reloadData(1, search);
    },
    [modelName_safe, reloadData],
  );

  const handleSort = (sortBy: string, sortOrder: "asc" | "desc") => {
    if (!isFeatureEnabled(modelName_safe, "sort")) return;

    const performSort = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: pagination?.page || 1,
          limit: pagination?.limit || 10,
          sort: sortBy,
          order: sortOrder,
        };

        const response = isViewingTrash
          ? await genericApi.getDeleted(modelName_safe, params)
          : await genericApi.getAll(modelName_safe, params);

        setData(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 10,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
        setCurrentSort({ key: sortBy, direction: sortOrder });
        setLoading(false);
      } catch {
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    performSort();
  };

  const handleCreate = async (data: any) => {
    if (!isFeatureEnabled(modelName_safe, "create")) return;

    try {
      setFormLoading(true);
      await genericApi.create(modelName_safe, data);
      setShowCreateForm(false);
      reloadData();
    } catch (error) {
      setError(`Failed to create ${displayName?.toLowerCase()}`);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!isFeatureEnabled(modelName_safe, "update") || !selectedRecord) return;

    try {
      setFormLoading(true);
      await genericApi.update(
        modelName_safe,
        selectedRecord.id || selectedRecord._id,
        data,
      );
      setShowEditForm(false);
      setSelectedRecord(null);
      reloadData();
    } catch (error) {
      setError(`Failed to update ${displayName?.toLowerCase()}`);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleImport = async (data: any[]) => {
    if (!isFeatureEnabled(modelName_safe, "import")) return;

    try {
      setFormLoading(true);
      await genericApi.bulkCreate(modelName_safe, data);
      reloadData();
    } catch (error) {
      setError(`Failed to import ${pluralName?.toLowerCase()}`);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleExport = async (format: string, useFilters: boolean) => {
    if (!isFeatureEnabled(modelName_safe, "export")) return;

    try {
      const filters = useFilters
        ? {
            /* Add current filters here if needed */
          }
        : {};
      const response = await genericApi.export(
        modelName_safe,
        format,
        useFilters,
        filters,
      );

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers["content-disposition"]?.split("filename=")[1] ||
        `${pluralName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(`Failed to export ${pluralName?.toLowerCase()}`);
      throw error;
    }
  };

  const handleValidateImport = async (data: any[]) => {
    if (!isFeatureEnabled(modelName_safe, "import"))
      return { valid: false, errors: [] };

    try {
      return await genericApi.validateBulkData(modelName_safe, data);
    } catch {
      return {
        valid: false,
        errors: ["Validation failed"],
      };
    }
  };

  const handleToggleTrash = () => {
    if (!isFeatureEnabled(modelName_safe, "viewTrash")) return;
    setIsViewingTrash(!isViewingTrash);
  };

  // Usar columnas configuradas (que incluyen visibilidad y orden del usuario)
  const columns = configuredColumns;

  // El modal de detalles debe abrirse si hay un id en la URL
  const isDetailOpen = !!recordId;

  // Check de configuración después de todos los hooks
  if (!config) {
    return (
      <div className="p-6 text-center bg-background border border-destructive/20 rounded-lg">
        <div className="text-destructive text-sm font-medium">Configuration Error</div>
        <p className="text-destructive/80 mt-2 text-sm">
          Model configuration not found for: {modelName}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-background border border-destructive/20 rounded-lg">
        <div className="mb-4">
          <div className="text-destructive text-sm font-medium">
            Something went wrong
          </div>
          <p className="text-destructive/80 mt-2 text-sm">{error}</p>
        </div>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              setError(null);
              fetchSchema();
              if (schema) {
                fetchData();
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (schemaLoading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-background rounded-xl z-50">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-3xl mb-4 animate-pulse">
          S
        </div>
        <div className="text-lg font-bold text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <CrudTable
        title={`${uiConfig.pluralName || pluralName} Management`}
        description={uiConfig.description || `Manage ${pluralName?.toLowerCase()}`}
        data={data}
        columns={columns}
        allSchemaFields={schema?.fields}
        onAdd={isFeatureEnabled(modelName_safe, "create") ? handleAdd : undefined}
        onEdit={isFeatureEnabled(modelName_safe, "update") ? handleEdit : undefined}
        onDelete={isFeatureEnabled(modelName_safe, "delete") ? handleDelete : undefined}
        onRestore={
          isFeatureEnabled(modelName_safe, "restore") ? handleRestore : undefined
        }
        onView={handleView}
        searchPlaceholder={`Search ${uiConfig.pluralName?.toLowerCase() || pluralName?.toLowerCase()}...`}
        isViewingTrash={isViewingTrash}
        onToggleTrash={
          isFeatureEnabled(modelName_safe, "viewTrash") ? handleToggleTrash : undefined
        }
        trashCount={trashCount}
        onToggleColumn={toggleColumnVisibility}
        onSetColumnOrder={setColumnOrder}
        onResetColumns={resetConfig}
        visibleColumns={visibleColumns}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={isFeatureEnabled(modelName_safe, "search") ? handleSearch : undefined}
        onAdvancedFiltersChange={(filters) => {
          console.log("Advanced filters changed:", filters);
        }}
        onSort={isFeatureEnabled(modelName_safe, "sort") ? handleSort : undefined}
        currentSort={currentSort}
        loading={loading}
        onImport={isFeatureEnabled(modelName_safe, "import") ? handleImport : undefined}
        onExport={isFeatureEnabled(modelName_safe, "export") ? handleExport : undefined}
        onValidateImport={
          isFeatureEnabled(modelName_safe, "import") ? handleValidateImport : undefined
        }
        modelName={collectionNamePlural}
      />

      {/* Vista detallada */}
      <RecordDetailView
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        record={selectedRecord}
        modelName={modelName_safe}
        title={
          selectedRecord
            ? `${selectedRecord.name || selectedRecord.title || "Record"} Details`
            : undefined
        }
        nestedPath={nestedPath}
      />

      {/* Formulario de creación */}
      {isFeatureEnabled(modelName_safe, "create") && (
        <DynamicForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleCreate}
          modelName={modelName_safe}
          mode="create"
          loading={formLoading}
        />
      )}

      {/* Formulario de edición */}
      {isFeatureEnabled(modelName_safe, "update") && (
        <DynamicForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleUpdate}
          modelName={modelName_safe}
          initialData={selectedRecord}
          mode="edit"
          loading={formLoading}
          title={
            selectedRecord
              ? `Edit ${selectedRecord.name || selectedRecord.title || "Record"}`
              : undefined
          }
        />
      )}

      {/* Dialog de confirmación para delete/restore */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((v) => ({ ...v, open }))}
      >
        <DialogContentNoClose className="max-w-md px-6 rounded-xl">
          <DialogHeader>
            <DialogTitle
              className={
                (confirmDialog.action === "delete"
                  ? "text-destructive "
                  : "text-green-700 ") + "mb-2"
              }
            >
              {confirmDialog.action === "delete"
                ? "Eliminar registro"
                : "Restaurar registro"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "delete"
                ? `¿Estás seguro que deseas eliminar este ${displayName.toLowerCase()}? Esta acción no se puede deshacer.`
                : `¿Estás seguro que deseas restaurar este ${displayName.toLowerCase()}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, action: null, item: null })
              }
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.action === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {confirmDialog.action === "delete" ? "Eliminar" : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContentNoClose>
      </Dialog>
    </div>
  );
}
