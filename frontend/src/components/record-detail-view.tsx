import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/layout/card";
import { Badge } from "./ui/data-display/badge";
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Tag,
  User,
  Loader2,
  ExternalLink,
  Hash,
  Type,
  ToggleLeft,
  List,
  FileJson,
  Link,
  Copy,
  Check,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/layout/dialog";
import {
  schemaService,
  type FieldDefinition,
  type ModelSchema,
  getDetailFields,
} from "../services/schema";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/layout/breadcrumb";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/data-display/table";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { camelToTitleCase } from "../lib/utils";
import { WeekdaysDisplay, type Weekdays } from "@/components/ui/weekdays-display";
import { useInternalNavigation } from "../hooks/use-internal-navigation";

interface RecordDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  modelName: string;
  title?: string;
  nestedPath?: string;
}

// Componente para preview de imágenes
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
            top: mousePosition.y - 150,
          }}
        >
          <div className="bg-background border border-border rounded-lg shadow-lg p-2 max-w-xs">
            <img
              src={src}
              alt="Preview"
              className="max-w-full max-h-32 object-contain rounded"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function RecordDetailView({
  isOpen,
  onClose,
  record,
  modelName,
  nestedPath,
}: RecordDetailViewProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [schema, setSchema] = useState<ModelSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "metadata" | "development">(
    "basic",
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  // Drilldown state
  const [drillPath, setDrillPath] = useState<(string | number)[]>([]);
  const [drillValue, setDrillValue] = useState<any>(record);
  const navigate = useNavigate();
  const { navigate: internalNavigate } = useInternalNavigation();

  // Cargar esquema dinámicamente
  useEffect(() => {
    if (isOpen && modelName && record) {
      loadSchema();
    }
  }, [isOpen, modelName, record]);

  // Reset solo cuando cambia el modelo, no al cerrar
  useEffect(() => {
    if (modelName) {
      setLoading(true);
      setError(null);
      setFields([]);
      setSchema(null);
      setActiveTab("basic");
    }
  }, [modelName]);

  // Reset drilldown on open/model change
  useEffect(() => {
    setDrillPath([]);
    setDrillValue(record);
  }, [record, modelName, isOpen]);

  // Procesar nestedPath automáticamente cuando cambia la URL o el modal se abre
  useEffect(() => {
    if (isOpen && record && schema) {
      processNestedPath();
    }
  }, [isOpen, nestedPath, record, schema]);

  const processNestedPath = () => {
    if (!nestedPath || !record || !schema) return;

    try {
      // Convertir el path de string a array (ej: "typeRelatedFields/interestRates" -> ["typeRelatedFields", "interestRates"])
      const pathSegments = nestedPath
        .split("/")
        .filter((segment) => segment.trim() !== "");

      if (pathSegments.length === 0) return;

      // Navegar por el path para validar que existe
      let currentValue = record;
      let currentPath: (string | number)[] = [];

      for (const segment of pathSegments) {
        // Intentar como string primero, luego como número
        let nextValue;
        if (currentValue && typeof currentValue === "object") {
          nextValue = currentValue[segment];
          if (nextValue === undefined && !isNaN(Number(segment))) {
            nextValue = currentValue[Number(segment)];
          }
        }

        if (nextValue === undefined) {
          return;
        }

        currentPath.push(segment);
        currentValue = nextValue;
      }

      // Si llegamos aquí, el path es válido
      setDrillPath(currentPath);
      setDrillValue(currentValue);
    } catch (error) {
      console.error(`❌ Error processing nested path: ${nestedPath}`, error);
    }
  };

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const modelSchema = await schemaService.getModelSchema(modelName);
      const detailFields = getDetailFields(modelSchema);

      setSchema(modelSchema);
      setFields(detailFields);
    } catch (err) {
      console.error("Error loading schema:", err);
      setError(err instanceof Error ? err.message : "Failed to load schema");
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (type: string, key: string) => {
    // Iconos específicos por tipo de campo primero
    switch (type) {
      case "weekdays":
        return <CalendarDays className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "url":
        return <Link className="w-4 h-4" />;
      case "date":
        return <Calendar className="w-4 h-4" />;
      case "boolean":
        return <ToggleLeft className="w-4 h-4" />;
      case "number":
        return <Hash className="w-4 h-4" />;
      case "array":
        return <List className="w-4 h-4" />;
      case "object":
        return <FileJson className="w-4 h-4" />;
      case "string":
        return <Type className="w-4 h-4" />;
      default:
        // Iconos específicos por nombre de campo como fallback
        switch (key.toLowerCase()) {
          case "phone":
          case "telefono":
            return <Phone className="w-4 h-4" />;
          case "address":
          case "direccion":
            return <MapPin className="w-4 h-4" />;
          case "name":
          case "nombre":
            return <Building2 className="w-4 h-4" />;
          case "cardtype":
          case "card":
            return <CreditCard className="w-4 h-4" />;
          case "category":
          case "categoryid":
          case "categoria":
            return <Tag className="w-4 h-4" />;
          case "user":
          case "userid":
          case "usuario":
            return <User className="w-4 h-4" />;
          default:
            return <Type className="w-4 h-4" />; // Icono por defecto
        }
    }
  };

  const formatValue = (value: any, field: FieldDefinition): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    switch (field.type) {
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );

      case "date":
        return new Date(value).toLocaleString();

      case "email":
        return (
          <a
            href={`mailto:${value}`}
            className="text-primary hover:underline flex items-center gap-2 group"
          >
            {value.length > 30 ? (
              <div className="max-w-xs">
                <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent px-1 pb-1 min-h-[2.2em] flex items-end">
                  <span className="text-sm">{value}</span>
                </div>
              </div>
            ) : (
              <span className="font-medium">{value}</span>
            )}
          </a>
        );

      case "url":
        // Verificar si es una imagen para mostrar preview
        const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(value);
        const linkContent = (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-2 group"
          >
            <span className="font-medium">Link</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
          </a>
        );

        return isImage ? (
          <ImagePreview src={value}>{linkContent}</ImagePreview>
        ) : (
          linkContent
        );

      case "weekdays":
        return value ? (
          <WeekdaysDisplay weekdays={value as Weekdays} size="sm" />
        ) : (
          <span className="text-muted-foreground italic">Not set</span>
        );

      case "array":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground italic">Empty list</span>
              ) : (
                value.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {String(item)}
                  </Badge>
                ))
              )}
            </div>
          );
        }
        return <span className="text-muted-foreground italic">Invalid array</span>;

      case "object":
        if (typeof value === "object") {
          return (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <pre className="text-xs overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent px-1 pb-1 min-h-[2.2em] flex items-end font-mono leading-relaxed">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          );
        }
        return String(value);

      case "number":
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;

      default:
        return value === null || value === undefined || value === "" ? (
          <span className="text-muted-foreground italic">Not set</span>
        ) : (
          <span className="font-medium">{String(value)}</span>
        );
    }
  };

  const groupFields = (fields: FieldDefinition[]) => {
    // Campos que siempre deben pertenecer a la sección METADATA
    const metadataFields = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "deleted",
      "__v",
      "_id",
    ];

    const basicFields = fields.filter((f) => !metadataFields.includes(f.key));

    // Solo incluir campos de metadata que realmente existen en el record
    const metaFields = fields.filter(
      (f) =>
        metadataFields.includes(f.key) &&
        record &&
        record[f.key] !== undefined &&
        record[f.key] !== null &&
        record[f.key] !== "",
    );

    return { basicFields, metaFields };
  };

  // Componente para renderizar campos con tamaño constante
  const FieldCard = ({
    field,
    isMetadata = false,
    recordOverride,
  }: {
    field: FieldDefinition;
    isMetadata?: boolean;
    recordOverride?: any;
  }) => {
    const value = recordOverride ? recordOverride[field.key] : record[field.key];
    const isObjectOrArray = typeof value === "object" && value !== null;
    const isBoolean = typeof value === "boolean";
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    // Detectar referencia
    const isReference =
      field.key.endsWith("Id") && typeof value === "string" && value.length > 0;
    let refModel = null;
    if (isReference) {
      // Inferir modelo: quitar 'Id', minúscula, pluralizar (simple)
      const base = field.key.slice(0, -2);
      refModel = base.toLowerCase() + (base.endsWith("s") ? "" : "s");
    }
    // Solo es cliqueable si es objeto o array (no primitivos) Y NO es weekdays
    const isWeekdays = field.type === "weekdays";
    const isClickable =
      !isWeekdays && (isObjectOrArray || (Array.isArray(value) && value.length > 0));

    // Para valores primitivos, siempre permitir click to copy (excepto booleanos y valores vacíos)
    const isPrimitiveClickable =
      !isWeekdays && !isObjectOrArray && !isBoolean && !isEmpty && !isReference;

    return (
      <div className="h-24 w-full group">
        <div
          className={`h-full p-3 rounded-lg border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all duration-200 bg-card hover:bg-accent/5 ${isClickable || isPrimitiveClickable ? "cursor-pointer" : ""}`}
          onClick={
            isClickable || isPrimitiveClickable
              ? (e) => {
                  if (Array.isArray(value)) {
                    if (value.length === 0) return;
                    handleDrill(field.key, value);
                    return;
                  }
                  if (isObjectOrArray) {
                    handleDrill(field.key, value);
                    return;
                  }
                  // Para primitivos: copiar valor
                  if (field.type === "email" || field.type === "url") {
                    if ((e.target as HTMLElement).tagName === "A") return;
                  }
                  handleCopyValue(value);
                }
              : undefined
          }
          title={
            isClickable
              ? isObjectOrArray
                ? "Click to expand"
                : "Click to copy"
              : isPrimitiveClickable
                ? "Click to copy"
                : undefined
          }
        >
          <div className="flex items-center gap-2 mb-2 select-none">
            <div className="p-1 rounded bg-muted/50 group-hover:bg-primary/10 transition-colors flex-shrink-0 flex items-center justify-center">
              {isMetadata ? (
                <Calendar className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              ) : (
                getFieldIcon(field.type, field.key)
              )}
            </div>
            <span className="font-medium text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
              {field.label || field.key}
            </span>
          </div>
          <div className="relative text-xs leading-tight h-10 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent pr-1 select-none">
            {isReference ? (
              <button
                className="text-primary underline hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-0 p-0 m-0"
                onClick={() => navigate(`/${refModel}/${value}`)}
                title={`Go to ${refModel} details`}
              >
                {value}
              </button>
            ) : Array.isArray(value) ? (
              value.length === 0 ? (
                <span className="text-muted-foreground italic">Empty list</span>
              ) : (
                <span className="text-primary/80 font-medium inline-flex items-center gap-1">
                  Click to View <ExternalLink className="w-3 h-3 inline-block" />
                </span>
              )
            ) : field.type === "object" ? (
              <span className="text-primary/80 font-medium inline-flex items-center gap-1">
                Click to Expand <ExternalLink className="w-3 h-3 inline-block" />
              </span>
            ) : (
              formatValue(value, field)
            )}
            {field.type !== "weekdays" && (
              <span className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleCopyJSON = async () => {
    try {
      const jsonString = JSON.stringify(record, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Actualizar posición del slider cuando cambia la pestaña activa
  useEffect(() => {
    if (isOpen && tabsRef.current) {
      // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
      const updateSliderPosition = () => {
        const activeButton = tabsRef.current?.querySelector(
          `[data-tab="${activeTab}"]`,
        ) as HTMLElement;
        if (activeButton) {
          const containerRect = tabsRef.current!.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();
          const left = buttonRect.left - containerRect.left - 4; // -4 for container padding
          const width = buttonRect.width;

          setSliderStyle({
            left: `${left}px`,
            width: `${width}px`,
            opacity: 1,
          });
        }
      };

      // Doble requestAnimationFrame para asegurar que el layout esté completamente calculado
      requestAnimationFrame(() => {
        requestAnimationFrame(updateSliderPosition);
      });
    }
  }, [activeTab, isOpen]);

  // Navegación drilldown - USAR NAVEGACIÓN INTERNA EN LUGAR DE navigate()
  const handleDrill = (keyOrIndex: string | number, value: any) => {
    const newPath = [...drillPath, keyOrIndex];
    setDrillPath(newPath);
    setDrillValue(value);
    // Actualizar la URL sin recargar la página usando el hook personalizado
    const newUrl = `/${modelName}/${record._id || record.id}/${newPath.join("/")}`;
    internalNavigate(newUrl);
  };

  const handleBreadcrumbClick = (idx: number) => {
    if (idx === -1) {
      // Navegar al record principal
      setDrillPath([]);
      setDrillValue(record);
      const newUrl = `/${modelName}/${record._id || record.id}`;
      internalNavigate(newUrl);
    } else {
      // Construir el path anidado hasta el índice seleccionado
      const newPath = drillPath.slice(0, idx + 1);
      let currentValue = record;
      for (const segment of newPath) {
        if (currentValue && typeof currentValue === "object") {
          currentValue = currentValue[segment];
        }
      }
      setDrillPath(newPath);
      setDrillValue(currentValue);
      const nestedPath = newPath.join("/");
      const newUrl = `/${modelName}/${record._id || record.id}${nestedPath ? "/" + nestedPath : ""}`;
      internalNavigate(newUrl);
    }
  };

  // Helper para encontrar el FieldDefinition correspondiente a la ruta actual
  function getFieldDefForDrillPath(
    schema: ModelSchema | null,
    drillPath: (string | number)[],
  ): any {
    if (!schema || !schema.fields) return undefined;
    let fields: any = schema.fields;
    let fieldDef: any = undefined;
    for (let i = 0; i < drillPath.length; i++) {
      const key = drillPath[i];
      fieldDef = fields.find((f: any) => f.key === key);
      if (!fieldDef) return undefined;
      if ((fieldDef as any).nested && i < drillPath.length - 1) {
        fields = (fieldDef as any).nested;
      }
    }
    return fieldDef;
  }

  // Render drilldown content
  const renderDrillContent = (value: any, fieldDef?: any) => {
    // Si hay metadata 'nested', usarla para mostrar los hijos con label y tipo
    if (fieldDef && fieldDef.nested && Array.isArray(fieldDef.nested)) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {fieldDef.nested.map((childField: any) => (
            <FieldCard
              key={childField.key}
              field={{ ...childField }}
              recordOverride={value}
            />
          ))}
        </div>
      );
    }
    // Fallback: lógica anterior
    if (Array.isArray(value)) {
      // Tabla para arrays
      if (value.length === 0) {
        return <div className="text-muted-foreground italic">Empty list</div>;
      }
      // Si los elementos son objetos, mostrar tabla con claves
      const isObjArray = value.every(
        (el) => el && typeof el === "object" && !Array.isArray(el),
      );
      if (isObjArray) {
        const allKeys = Array.from(new Set(value.flatMap((el) => Object.keys(el))));
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                {allKeys.map((k) => (
                  <TableHead key={k}>{k}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((el, idx) => (
                <TableRow
                  key={idx}
                  className="cursor-pointer hover:bg-accent/30"
                  onClick={() => handleDrill(idx, el)}
                >
                  <TableCell>{idx}</TableCell>
                  {allKeys.map((k) => (
                    <TableCell key={k}>
                      {typeof el[k] === "object" && el[k] !== null
                        ? Array.isArray(el[k])
                          ? el[k].length === 0
                            ? "Empty list"
                            : "Click to View"
                          : "Click to View"
                        : String(el[k] ?? "null")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      } else {
        // Array simple
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((el, idx) => (
                <TableRow
                  key={idx}
                  className={
                    typeof el === "object" && el !== null
                      ? "cursor-pointer hover:bg-accent/30"
                      : ""
                  }
                  onClick={() =>
                    typeof el === "object" && el !== null && handleDrill(idx, el)
                  }
                >
                  <TableCell>{idx}</TableCell>
                  <TableCell>
                    {typeof el === "object" && el !== null
                      ? Array.isArray(el)
                        ? el.length === 0
                          ? "Empty list"
                          : "Click to View"
                        : "Click to View"
                      : String(el ?? "null")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      }
    } else if (value && typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0)
        return <div className="text-muted-foreground italic">Empty object</div>;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {keys.map((k) => {
            const v = value[k];
            const isExpandable = typeof v === "object" && v !== null;
            const jsType = typeof v;
            return (
              <div
                key={k}
                className={isExpandable ? "cursor-pointer" : undefined}
                onClick={isExpandable ? () => handleDrill(k, v) : undefined}
              >
                <Card className="h-24 group hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <CardContent className="h-full p-3 flex flex-col justify-start">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded bg-muted/50 group-hover:bg-primary/10 transition-colors flex-shrink-0 flex items-center justify-center">
                        <FileJson className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-medium text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                        {k}
                      </span>
                    </div>
                    <div className="relative text-xs leading-tight min-h-[1.5em] mt-1 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent pr-1">
                      {isExpandable ? (
                        <span className="text-primary/80 font-medium inline-flex items-center gap-1">
                          Click to Expand{" "}
                          <ExternalLink className="w-3 h-3 inline-block" />
                        </span>
                      ) : (
                        formatValue(v, {
                          key: k,
                          type: jsTypeToFieldType(jsType),
                          label: k,
                          required: false,
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Valor primitivo
      return (
        <div className="text-foreground font-mono text-base break-all">
          {String(value)}
        </div>
      );
    }
  };

  // Función para copiar valor y mostrar toast
  const handleCopyValue = async (value: string | number | boolean) => {
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success("¡Valor copiado al portapapeles!", { duration: 1800 });
    } catch {
      toast.error("No se pudo copiar el valor");
    }
  };

  function jsTypeToFieldType(jsType: string): string {
    switch (jsType) {
      case "string":
        return "text";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "object":
        return "object";
      default:
        return jsType;
    }
  }

  if (!record) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Loading details</DialogTitle>
            <DialogDescription>
              Loading the details of the selected record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Error loading details</DialogTitle>
            <DialogDescription>
              There was an error loading the details of the selected record.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Error loading details</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!schema || fields.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No details available</DialogTitle>
            <DialogDescription>
              No details are available for this record.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No details available for this record.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { basicFields, metaFields } = groupFields(fields);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[600px] h-[700px] max-w-none overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b relative">
          {drillPath.length > 0 ? (
            <button
              onClick={() => handleBreadcrumbClick(drillPath.length - 2)}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm font-medium px-2 py-1 rounded transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <DialogTitle className="text-xl font-semibold text-center">
              Details
            </DialogTitle>
          )}
        </DialogHeader>

        {/* Tabs selector */}
        {drillPath.length === 0 && (
          <div className="flex-shrink-0 px-6 pt-4 pb-2">
            <div
              className="flex space-x-1 bg-muted p-1 rounded-lg relative"
              ref={tabsRef}
            >
              <button
                onClick={() => setActiveTab("basic")}
                className={`flex-1 min-w-[140px] h-10 px-6 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  activeTab === "basic"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Information
              </button>
              <button
                onClick={() => setActiveTab("metadata")}
                className={`flex-1 min-w-[140px] h-10 px-6 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  activeTab === "metadata"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Metadata
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={() => setActiveTab("development")}
                  className={`flex-1 min-w-[140px] h-10 px-6 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                    activeTab === "development"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  Development
                </button>
              )}
              {/* Slider animado */}
              <div
                className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-200 ease-out"
                style={sliderStyle}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 px-6 py-6 overflow-y-auto">
          {drillPath.length === 0 ? (
            <>
              {/* Basic Information y Metadata - Body scrolleable */}
              {(activeTab === "basic" || activeTab === "metadata") && (
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "basic" && (
                    <>
                      {basicFields.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {basicFields.map((field) => (
                            <FieldCard key={field.key} field={field} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center min-h-[200px]">
                          <div className="text-center text-muted-foreground">
                            No basic information available.
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "metadata" && (
                    <>
                      {metaFields.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {metaFields.map((field) => (
                            <FieldCard key={field.key} field={field} isMetadata />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center min-h-[200px]">
                          <div className="text-center text-muted-foreground">
                            No metadata available.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Development - Body fijo, solo JSON scrolleable */}
              {activeTab === "development" &&
                process.env.NODE_ENV === "development" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col min-h-0">
                      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                        <div className="flex-1 border border-border/50 rounded-lg overflow-hidden min-h-0 relative m-4">
                          {/* Botón de copiar */}
                          <button
                            onClick={handleCopyJSON}
                            className={`absolute top-3 right-3 z-10 p-2 rounded-md transition-all duration-200 ${
                              copySuccess
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            title={copySuccess ? "Copied!" : "Copy JSON to clipboard"}
                          >
                            {copySuccess ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <pre className="text-xs font-mono leading-relaxed h-full overflow-auto p-3 bg-muted/20 m-0">
                            {JSON.stringify(record, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
            </>
          ) : (
            renderDrillContent(drillValue, getFieldDefForDrillPath(schema, drillPath))
          )}
        </div>

        {drillPath.length > 0 && (
          <footer className="sticky bottom-0 left-0 w-full bg-background/95 border-t border-border px-6 py-2 z-10">
            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
              <Breadcrumb className="text-xs">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      onClick={() => handleBreadcrumbClick(-1)}
                      className="cursor-pointer"
                    >
                      root
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {(() => {
                    // Construir la ruta de labels acumulando la metadata
                    let fields = schema?.fields;
                    let labels: string[] = [];
                    for (let i = 0; i < drillPath.length; i++) {
                      const key = drillPath[i];
                      const found = fields?.find((f) => f.key === key);
                      if (found) {
                        labels.push(found.label || camelToTitleCase(found.key));
                        fields = (found as any).nested;
                      } else if (typeof key === "number") {
                        labels.push(`[${key}]`);
                      } else if (key) {
                        labels.push(String(key));
                      }
                    }
                    return labels.map((label, i) =>
                      label ? (
                        <>
                          <BreadcrumbSeparator key={`sep-${i}`} />
                          <BreadcrumbItem key={i}>
                            {i === labels.length - 1 ? (
                              <BreadcrumbPage>{label}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink
                                asChild
                                onClick={() => handleBreadcrumbClick(i)}
                                className="cursor-pointer"
                              >
                                {label}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </>
                      ) : null,
                    );
                  })()}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
