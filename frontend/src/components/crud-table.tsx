import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/layout/card";
import { Button } from "./ui/base/button";
import { Input } from "./ui/forms/input";
import { Badge } from "./ui/data-display/badge";
import { Skeleton } from "./ui/feedback/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/forms/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Label } from "./ui/forms/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/base/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Upload,
  Download,
  ExternalLink,
} from "lucide-react";
import { ActionsMenu } from "./actions-menu";
import { ColumnSelector } from "./column-selector";
import { TrashToggle } from "./trash-toggle";
import { ImportDialog } from "./import-dialog";
import { ExportDialog } from "./export-dialog";
import { WeekdaysDisplay, type Weekdays } from "@/components/ui/weekdays-display";
import { camelToTitleCase } from "../lib/utils";
import type { ColumnConfig } from "../hooks/use-column-config";
import type { FieldDefinition } from "../services/schema";

interface CrudTableProps {
  title: string;
  description: string;
  data: any[];
  columns: ColumnConfig[];
  allSchemaFields?: FieldDefinition[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onRestore?: (item: any) => void;
  onView?: (item: any) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  // Props para manejo de papelera
  isViewingTrash?: boolean;
  onToggleTrash?: () => void;
  trashCount?: number;
  // Props para personalización de columnas
  onToggleColumn?: (columnKey: string) => void;
  onSetColumnOrder?: (orderedKeys: string[]) => void;
  onResetColumns?: () => void;
  visibleColumns?: string[];
  // Props para paginación del servidor
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onAdvancedFiltersChange?: (filters: any) => void;
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  currentSort?: { key: string; direction: "asc" | "desc" } | null;
  loading?: boolean;
  // Props para import/export
  onImport?: (data: any[], format: string) => Promise<void>;
  onExport?: (format: string, useFilters: boolean) => Promise<void>;
  onValidateImport?: (data: any[]) => Promise<{ valid: boolean; errors: string[] }>;
  modelName?: string;
}

// Auxiliar para celdas con fade solo si hay overflow
function CellWithFade({ value }: { value: any }) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const checkOverflow = () => {
      // Solo para mantener la referencia, no necesitamos el estado
      el.scrollWidth > el.clientWidth;
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [value]);
  return (
    <span className="block max-w-[320px] relative overflow-hidden whitespace-nowrap">
      <div
        ref={contentRef}
        className="block overflow-hidden whitespace-nowrap pr-8 text-fade-right"
      >
        {value === null || value === undefined || value === "" ? (
          <span className="italic text-muted-foreground">Not set</span>
        ) : (
          value
        )}
      </div>
    </span>
  );
}

// Función auxiliar para convertir ColumnConfig a FieldDefinition
const columnToField = (column: ColumnConfig): FieldDefinition => ({
  key: column.key,
  label: column.label || camelToTitleCase(column.key),
  type: column.type,
  required: false,
  sortable: column.sortable,
  visible: column.visible,
});

// Componente para preview de imágenes en tabla
function ImagePreview({ src, children }: { src: string; children: React.ReactNode }) {
  const [showPreview, setShowPreview] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowPreview(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  return (
    <div
      className="inline-block relative"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showPreview && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 120,
          }}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-lg p-2"
            style={{ width: "240px" }}
          >
            <div
              className="bg-white rounded-md border border-border overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                src={src}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CrudTable({
  title,
  description,
  data,
  columns,
  allSchemaFields,
  onAdd,
  onEdit,
  onDelete,
  onRestore,
  onView,
  searchPlaceholder = "Search...",
  filters = [],
  isViewingTrash = false,
  onToggleTrash,
  trashCount,
  onToggleColumn,
  onSetColumnOrder,
  onResetColumns,
  visibleColumns = [],
  pagination,
  onPageChange,
  onSearch,
  onAdvancedFiltersChange,
  onSort,
  currentSort,
  loading = false,
  onImport,
  onExport,
  onValidateImport,
  modelName = "Records",
}: CrudTableProps) {
  const navigate = useNavigate();

  // Determinar si necesitamos scroll horizontal (después de 6 columnas visibles)
  const shouldScroll = visibleColumns.length > 6;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(currentSort || null);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});
  const [advancedFilters, setAdvancedFilters] = useState<{ [key: string]: any }>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Usar paginación del servidor si está disponible, sino usar paginación local
  const isServerPagination = !!pagination;

  // Sincronizar sortConfig con currentSort cuando cambie
  useEffect(() => {
    if (
      currentSort &&
      (!sortConfig ||
        currentSort.key !== sortConfig.key ||
        currentSort.direction !== sortConfig.direction)
    ) {
      setSortConfig(currentSort);
    }
  }, [currentSort]);

  // Obtener columnas visibles
  const visibleColumnConfigs = useMemo(() => {
    if (visibleColumns.length > 0) {
      return columns.filter((col) => visibleColumns.includes(col.key));
    }
    return columns.filter((col) => col.visible !== false);
  }, [columns, visibleColumns]);

  // Función para calcular ancho fijo basado en tipo de dato
  const getColumnWidth = (column: ColumnConfig) => {
    const headerText = column.label || camelToTitleCase(column.key);
    const headerWidth = headerText.length * 8 + 60; // Aproximación basada en caracteres

    // Anchos fijos basados en tipo de dato
    switch (column.type) {
      case "boolean":
        return Math.max(100, headerWidth); // Muy angosto para booleanos

      case "url":
        return Math.max(120, headerWidth); // Angosto para links

      case "date":
        return Math.max(140, headerWidth); // Ancho medio para fechas

      case "number":
      case "currency":
        return Math.max(120, headerWidth); // Ancho medio para números

      case "status":
        return Math.max(100, headerWidth); // Angosto para status

      case "enum":
        return Math.max(120, headerWidth); // Ancho medio para enums

      case "email":
        return Math.max(200, headerWidth); // Ancho medio para emails

      case "weekdays":
        return Math.max(200, headerWidth); // Ancho fijo para weekdays (7 badges)

      case "object":
      case "array":
        return Math.max(140, headerWidth); // Ancho medio para objetos/listas

      case "text":
      default:
        return 250; // Ancho fijo para texto, sin importar el header
    }
  };

  // 1. Calcular y fijar el ancho de cada columna visible una sola vez
  const columnWidths = useMemo(() => {
    return visibleColumnConfigs.reduce(
      (acc, column) => {
        acc[column.key] = getColumnWidth(column);
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [visibleColumnConfigs]); // Solo recalcular cuando cambien las columnas visibles

  // Filter and search data (solo para paginación local)
  const filteredData = useMemo(() => {
    if (isServerPagination) {
      return data; // El servidor ya filtró los datos
    }

    const filtered = data.filter((item) => {
      // Search across all text fields
      const searchMatch =
        searchTerm === "" ||
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        );

      // Apply basic filters
      const filterMatch = Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        return String(item[key]).toLowerCase() === value.toLowerCase();
      });

      // Apply advanced filters
      const advancedFilterMatch = Object.entries(advancedFilters).every(
        ([key, filterValue]) => {
          if (!filterValue) return true;

          const itemValue = item[key];
          const column = columns.find((c) => c.key === key);

          if (!column) return true;

          switch (column.type) {
            case "text":
            case "email":
            case "url":
              return (
                typeof itemValue === "string" &&
                itemValue.toLowerCase().includes(filterValue.toLowerCase())
              );

            case "number":
            case "currency": {
              const numValue = Number(itemValue);
              if (filterValue.min !== undefined && numValue < filterValue.min)
                return false;
              if (filterValue.max !== undefined && numValue > filterValue.max)
                return false;
              return true;
            }

            case "date": {
              const dateValue = new Date(itemValue);
              if (filterValue.from && dateValue < new Date(filterValue.from))
                return false;
              if (filterValue.to && dateValue > new Date(filterValue.to)) return false;
              return true;
            }

            case "boolean":
              return filterValue === null || itemValue === filterValue;

            case "enum":
              return filterValue.length === 0 || filterValue.includes(itemValue);

            default:
              return true;
          }
        },
      );

      return searchMatch && filterMatch && advancedFilterMatch;
    });

    // Sort data - solo si no es paginación del servidor
    if (sortConfig && !isServerPagination) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejar valores null/undefined
        if (aValue === null || aValue === undefined) aValue = "";
        if (bValue === null || bValue === undefined) bValue = "";

        // Convertir a string para comparación si es necesario
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Para fechas, convertir a timestamp
        if (sortConfig.key.includes("Date") || sortConfig.key.includes("At")) {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    data,
    searchTerm,
    activeFilters,
    advancedFilters,
    sortConfig,
    isServerPagination,
    columns,
  ]);

  // Pagination
  const totalPages = isServerPagination
    ? pagination?.totalPages || 0
    : Math.ceil((filteredData?.length || 0) / itemsPerPage);
  const totalResults = isServerPagination
    ? pagination?.total || 0
    : filteredData?.length || 0;
  const currentPageNumber = isServerPagination ? pagination?.page || 1 : currentPage;

  const paginatedData = isServerPagination
    ? data || []
    : (filteredData || []).slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      );

  const handleSort = (key: string) => {
    const newSortConfig = {
      key,
      direction:
        sortConfig?.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    } as { key: string; direction: "asc" | "desc" };

    setSortConfig(newSortConfig);

    // Si es paginación del servidor y hay callback de sorting, usarlo
    if (isServerPagination && onSort) {
      onSort(newSortConfig.key, newSortConfig.direction);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (!isServerPagination) {
      setCurrentPage(1);
    }
  };

  const handleAdvancedFiltersChangeInternal = (filters: any) => {
    setAdvancedFilters(filters);
    if (!isServerPagination) {
      setCurrentPage(1);
    }
    if (onAdvancedFiltersChange) {
      onAdvancedFiltersChange(filters);
    }
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setAdvancedFilters({});
    setSearchTerm("");
    setSortConfig(null);
    if (!isServerPagination) {
      setCurrentPage(1);
    }
    if (onSearch) {
      onSearch("");
    }
    if (onAdvancedFiltersChange) {
      onAdvancedFiltersChange({});
    }
    handleAdvancedFiltersChangeInternal({});
    if (onSort) {
      onSort("createdAt", "desc"); // Reset to default sorting
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePageChangeClick = (page: number) => {
    if (isServerPagination && onPageChange) {
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  const renderCell = (item: any, column: ColumnConfig) => {
    const value = item[column.key];

    if (column.render) {
      return column.render(value, item);
    }

    // Detectar si es una URL
    const isUrl =
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"));

    if (isUrl) {
      const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(value);
      const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
      };
      const linkContent = (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 group"
          onClick={handleLinkClick}
          style={{ lineHeight: "1", verticalAlign: "middle" }}
          data-clickable="true"
        >
          <span className="text-xs font-medium">Link</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
        </a>
      );

      if (isImage || column.key.includes("logo") || column.key.includes("image")) {
        return <ImagePreview src={value}>{linkContent}</ImagePreview>;
      }
      return linkContent;
    }

    switch (column.type) {
      case "status":
        return (
          <Badge
            variant={
              value === "Active"
                ? "default"
                : value === "Pending"
                  ? "secondary"
                  : "destructive"
            }
          >
            {value}
          </Badge>
        );
      case "date":
        return value ? (
          new Date(value).toLocaleDateString()
        ) : (
          <span className="italic text-muted-foreground">Not set</span>
        );
      case "currency":
        return value ? (
          `$${Number(value).toFixed(2)}`
        ) : (
          <span className="italic text-muted-foreground">Not set</span>
        );
      case "email":
      case "url":
      case "text":
        return <CellWithFade value={value} />;
      case "boolean":
        return value === null || value === undefined ? (
          <span className="italic text-muted-foreground">Not set</span>
        ) : value ? (
          "Yes"
        ) : (
          "No"
        );
      case "enum":
        return value === null || value === undefined ? (
          <span className="italic text-muted-foreground">Not set</span>
        ) : (
          value
        );
      case "object": {
        // Verificar si el objeto es nulo, vacío o no existe
        if (
          value === null ||
          value === undefined ||
          (typeof value === "object" && Object.keys(value).length === 0)
        ) {
          return <span className="italic text-muted-foreground">Not set</span>;
        }

        const recordId = item.id || item._id;
        if (!recordId)
          return <span className="italic text-muted-foreground">Not set</span>;
        const modelRoute = (modelName || "").toLowerCase();
        return (
          <span
            className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1 text-base"
            style={{ lineHeight: "1", verticalAlign: "middle" }}
            data-clickable="true"
            onClick={(e) => {
              e.stopPropagation();
              const baseUrl = `/${modelRoute}/${recordId}`;
              // Navegar directamente al campo específico usando React Router
              const nestedUrl = `${baseUrl}/${column.key}`;
              navigate(nestedUrl);
            }}
          >
            <span className="text-xs font-medium">Click to Expand</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
          </span>
        );
      }
      case "array": {
        // Verificar si el array es nulo, vacío o no existe
        if (
          value === null ||
          value === undefined ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return <span className="italic text-muted-foreground">Not set</span>;
        }

        const recordId = item.id || item._id;
        if (!recordId)
          return <span className="italic text-muted-foreground">Not set</span>;
        const modelRoute = (modelName || "").toLowerCase();
        return (
          <span
            className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1 text-base"
            style={{ lineHeight: "1", verticalAlign: "middle" }}
            data-clickable="true"
            onClick={(e) => {
              e.stopPropagation();
              const baseUrl = `/${modelRoute}/${recordId}`;
              // Navegar directamente al campo específico usando React Router
              const nestedUrl = `${baseUrl}/${column.key}`;
              navigate(nestedUrl);
            }}
          >
            <span className="text-xs font-medium">Click to View</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
          </span>
        );
      }
      case "weekdays":
        return value ? (
          <WeekdaysDisplay weekdays={value as Weekdays} size="md" />
        ) : (
          <span className="italic text-muted-foreground">Not set</span>
        );
      default:
        return value === null || value === undefined ? (
          <span className="italic text-muted-foreground">Not set</span>
        ) : (
          value
        );
    }
  };

  // Función para renderizar filtro recursivo de objeto
  const renderObjectFilter = (field: FieldDefinition, parentPath: string = "") => {
    const fieldPath = parentPath ? `${parentPath}.${field.key}` : field.key;
    const label = field.label || camelToTitleCase(field.key);

    // Si es un objeto con campos anidados, renderizar accordion
    if (field.type === "object" && field.nested && field.nested.length > 0) {
      return (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={fieldPath} className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline px-0">
              <span className="text-sm font-medium">{label}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-4 space-y-3 border-l-2 border-muted">
                {field.nested.map((nestedField) => (
                  <div key={nestedField.key} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {nestedField.label || camelToTitleCase(nestedField.key)}
                    </Label>
                    {renderFieldFilter(nestedField, fieldPath)}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    // Si es un campo primitivo, renderizar el filtro normal
    return renderFieldFilter(field, parentPath);
  };

  // Función para renderizar filtro de campo individual
  const renderFieldFilter = (field: FieldDefinition, parentPath: string = "") => {
    const fieldPath = parentPath ? `${parentPath}.${field.key}` : field.key;
    const value = advancedFilters[fieldPath];
    const label = field.label || camelToTitleCase(field.key);

    // Si tiene opciones (enum), usar select
    if (field.options && field.options.length > 0) {
      return (
        <div className="space-y-2">
          <Select
            onValueChange={(val) => {
              const currentValues = value || [];
              if (!currentValues.includes(val)) {
                handleAdvancedFilterChange(fieldPath, [...currentValues, val]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {value && value.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {value.map((item: string) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                  <button
                    onClick={() =>
                      handleAdvancedFilterChange(
                        fieldPath,
                        value.filter((v: string) => v !== item),
                      )
                    }
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Renderizar según el tipo de campo
    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            type={field.type === "email" ? "email" : "text"}
            value={value || ""}
            onChange={(e) => handleAdvancedFilterChange(fieldPath, e.target.value)}
            placeholder={`Filter by ${label.toLowerCase()}`}
            className="w-full"
          />
        );

      case "number":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={value?.min || ""}
              onChange={(e) =>
                handleAdvancedFilterChange(fieldPath, {
                  ...value,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Min"
              className="flex-1"
            />
            <Input
              type="number"
              value={value?.max || ""}
              onChange={(e) =>
                handleAdvancedFilterChange(fieldPath, {
                  ...value,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Max"
              className="flex-1"
            />
          </div>
        );

      case "date":
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={value?.from || ""}
              onChange={(e) =>
                handleAdvancedFilterChange(fieldPath, {
                  ...value,
                  from: e.target.value,
                })
              }
              className="flex-1"
            />
            <Input
              type="date"
              value={value?.to || ""}
              onChange={(e) =>
                handleAdvancedFilterChange(fieldPath, { ...value, to: e.target.value })
              }
              className="flex-1"
            />
          </div>
        );

      case "boolean":
        return (
          <Select
            value={value === null ? "all" : value?.toString()}
            onValueChange={(val) => {
              if (val === "all") handleAdvancedFilterChange(fieldPath, null);
              else handleAdvancedFilterChange(fieldPath, val === "true");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => handleAdvancedFilterChange(fieldPath, e.target.value)}
            placeholder={`Filter by ${label.toLowerCase()}`}
            className="w-full"
          />
        );
    }
  };

  const handleAdvancedFilterChange = (columnKey: string, value: any) => {
    const newFilters = {
      ...advancedFilters,
      [columnKey]: value,
    };
    setAdvancedFilters(newFilters);
    if (!isServerPagination) {
      setCurrentPage(1);
    }
    if (onAdvancedFiltersChange) {
      onAdvancedFiltersChange(newFilters);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          {/* Título y descripción alineados a la izquierda */}
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              <div className="bg-muted px-3 py-1 rounded-full">
                <span className="text-sm font-medium">
                  {totalResults.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          {/* Botón Add New arriba a la derecha */}
          <div className="flex flex-col items-end gap-2 min-w-[220px]">
            {/* Espacio reservado para mantener altura aunque no esté el botón Add New */}
            <div className="flex min-h-[40px]">
              {onAdd && !isViewingTrash ? (
                <>
                  <Button onClick={onAdd} className="rounded-r-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-l-none border-l border-primary-foreground/20"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : null}
            </div>
            {/* Fila de botones blancos pequeños debajo */}
            <div className="flex items-center gap-2 mt-2">
              {onToggleTrash && (
                <TrashToggle
                  isViewingTrash={isViewingTrash}
                  onToggle={onToggleTrash}
                  count={trashCount}
                />
              )}
              {onToggleColumn && onResetColumns && onSetColumnOrder && (
                <ColumnSelector
                  columns={columns}
                  visibleColumns={visibleColumns}
                  onToggleColumn={onToggleColumn}
                  onSetColumnOrder={onSetColumnOrder}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters & Search
            </CardTitle>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {Object.keys(advancedFilters).some((key) => {
                const value = advancedFilters[key];
                if (!value) return false;
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === "object") {
                  return Object.values(value).some(
                    (v) => v !== null && v !== undefined && v !== "",
                  );
                }
                return true;
              }) && (
                <Badge variant="secondary" className="ml-1">
                  {
                    Object.keys(advancedFilters).filter((key) => {
                      const value = advancedFilters[key];
                      if (!value) return false;
                      if (Array.isArray(value)) return value.length > 0;
                      if (typeof value === "object") {
                        return Object.values(value).some(
                          (v) => v !== null && v !== undefined && v !== "",
                        );
                      }
                      return true;
                    }).length
                  }
                </Badge>
              )}
            </Button>
          </div>

          {filters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={activeFilters[filter.key] || ""}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}

          {showAdvancedFilters && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(allSchemaFields || columns.map(columnToField))
                    .filter(
                      (field) =>
                        field.key !== "id" &&
                        !field.key.includes("Id") &&
                        field.key !== "deleted" &&
                        (field.key !== "deletedAt" || isViewingTrash),
                    )
                    .map((field) => (
                      <div key={field.key} className="space-y-2">
                        {field.type !== "object" ? (
                          <Label className="text-sm font-medium">
                            {field.label || camelToTitleCase(field.key)}
                          </Label>
                        ) : null}
                        {renderObjectFilter(field)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mostrar indicador cuando hay scroll horizontal */}
      {shouldScroll && (
        <div className="mb-2 text-xs text-foreground/70 flex items-center gap-1">
          <span>↔</span>
          <span>
            Scroll horizontally to see all columns. Actions column stays fixed.
          </span>
        </div>
      )}

      {/* Table o Empty State */}
      {loading || paginatedData.length > 0 ? (
        <Card noPadding className="overflow-hidden">
          <div
            className={`${shouldScroll ? "overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent" : ""} relative`}
            style={shouldScroll ? { maxWidth: "100%" } : {}}
          >
            <table className={`w-full ${shouldScroll ? "min-w-max" : ""}`}>
              <thead>
                <tr className="border-b bg-muted/50">
                  {visibleColumnConfigs.map((column) => {
                    // 2. Solo permitir sort si cumple todos los criterios
                    const canSort =
                      column.sortable &&
                      !column.render &&
                      column.type !== "object" &&
                      column.type !== "array" &&
                      column.type !== "url" &&
                      column.type !== "weekdays";
                    return (
                      <th
                        key={column.key}
                        className={`px-4 py-3 text-left text-sm font-medium whitespace-nowrap bg-muted/50 ${
                          canSort
                            ? "cursor-pointer hover:bg-muted/70 transition-colors"
                            : ""
                        }`}
                        style={{
                          width: shouldScroll
                            ? `${Math.max(120, columnWidths[column.key])}px`
                            : `${columnWidths[column.key]}px`,
                          minWidth: shouldScroll ? "120px" : "auto",
                        }}
                        onClick={() => canSort && handleSort(column.key)}
                      >
                        <div className="flex items-center gap-2">
                          {column.label || camelToTitleCase(column.key)}
                          {canSort &&
                            (sortConfig?.key === column.key ||
                              currentSort?.key === column.key) && (
                              <span className="text-xs">
                                {(sortConfig?.direction || currentSort?.direction) ===
                                "asc"
                                  ? "↑"
                                  : "↓"}
                              </span>
                            )}
                        </div>
                      </th>
                    );
                  })}
                  <th
                    className={`px-4 py-3 text-center text-sm font-medium whitespace-nowrap w-20 ${
                      shouldScroll
                        ? "sticky right-0 bg-muted border-l border-border shadow-[-4px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_rgba(0,0,0,0.3)] z-10"
                        : "bg-muted/50"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? // Shimmer de loading: 5 filas
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {visibleColumnConfigs.map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-5 w-full" />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </td>
                      </tr>
                    ))
                  : paginatedData.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="group border-b hover:bg-muted/50 cursor-pointer"
                        onClick={(e) => {
                          // No ejecutar onView si el clic viene de un enlace interno
                          const target = e.target as HTMLElement;
                          const isInternalLink = target.closest('a, [role="button"], button, [data-clickable="true"]');
                          if (!isInternalLink && onView) {
                            onView(item);
                          }
                        }}
                      >
                        {visibleColumnConfigs.map((column) => (
                          <td
                            key={column.key}
                            className="px-4 py-3 text-sm overflow-hidden bg-transparent"
                            style={{
                              width: shouldScroll
                                ? `${Math.max(120, columnWidths[column.key])}px`
                                : `${columnWidths[column.key]}px`,
                              minWidth: shouldScroll ? "120px" : "auto",
                            }}
                          >
                            {renderCell(item, column)}
                          </td>
                        ))}
                        <td
                          className={`px-4 py-3 text-center ${
                            shouldScroll
                              ? "sticky right-0 bg-background border-l border-border shadow-[-4px_0_8px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_8px_rgba(0,0,0,0.3)] z-10"
                              : "bg-background"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionsMenu
                            onView={onView ? () => onView(item) : undefined}
                            onEdit={
                              onEdit && !isViewingTrash ? () => onEdit(item) : undefined
                            }
                            onDelete={
                              onDelete && !isViewingTrash
                                ? () => onDelete(item)
                                : undefined
                            }
                            onRestore={
                              onRestore && isViewingTrash
                                ? () => onRestore(item)
                                : undefined
                            }
                            isViewingTrash={isViewingTrash}
                          />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24 bg-background min-h-[320px]">
          {/* SVG de documento minimalista */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-6 text-muted-foreground"
          >
            <rect
              x="12"
              y="8"
              width="32"
              height="40"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="18"
              y="16"
              width="20"
              height="2.5"
              rx="1.25"
              fill="currentColor"
              className="opacity-30"
            />
            <rect
              x="18"
              y="22"
              width="20"
              height="2.5"
              rx="1.25"
              fill="currentColor"
              className="opacity-30"
            />
            <rect
              x="18"
              y="28"
              width="12"
              height="2.5"
              rx="1.25"
              fill="currentColor"
              className="opacity-30"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            {isViewingTrash ? "No deleted records" : "No records"}
          </h3>
          <p className="text-muted-foreground text-base">
            {isViewingTrash
              ? "There are no deleted records in this resource"
              : "There are no records in this resource"}
          </p>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPageNumber - 1) * (pagination?.limit || itemsPerPage) + 1}{" "}
            to{" "}
            {Math.min(
              currentPageNumber * (pagination?.limit || itemsPerPage),
              totalResults,
            )}{" "}
            of {totalResults.toLocaleString()} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChangeClick(Math.max(1, currentPageNumber - 1))}
              disabled={currentPageNumber === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPageNumber} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChangeClick(Math.min(totalPages, currentPageNumber + 1))
              }
              disabled={currentPageNumber === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {onImport && (
        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={onImport}
          modelName={modelName}
          validateSchema={onValidateImport}
        />
      )}

      {/* Export Dialog */}
      {onExport && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={onExport}
          modelName={modelName}
          totalRecords={isServerPagination ? pagination?.total || 0 : data?.length || 0}
          filteredRecords={isServerPagination ? undefined : filteredData?.length || 0}
        />
      )}
    </div>
  );
}
