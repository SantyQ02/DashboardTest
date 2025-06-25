import { apiRequest } from "./api";

export interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  defaultValue?: any;
  readonly?: boolean;
  hidden?: boolean;
  arrayItemType?: string;
  sortable?: boolean;
  visible?: boolean;
  nested?: FieldDefinition[]; // Campos anidados para objetos
}

export interface ModelSchema {
  name: string;
  displayName: string;
  primaryKey: string;
  timestamps: boolean;
  fields: FieldDefinition[];
}

export interface SchemaResponse {
  success: boolean;
  data: ModelSchema;
  message?: string;
  error?: string;
}

export interface ModelInfo {
  name: string;
  displayName: string;
  description?: string;
}

// Función para convertir camelCase a Title Case
export function camelToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Función para obtener campos de formulario (excluyendo campos de metadata)
export function getFormFields(schema: ModelSchema): FieldDefinition[] {
  const excludedFields = [
    "id",
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "deleted",
    "isActive",
    "isDeleted",
  ];

  return schema.fields.filter(
    (field) => !excludedFields.includes(field.key) && !field.key.endsWith("Id"), // Excluir campos de relación por ID
  );
}

// Función para obtener campos de detalle (incluyendo timestamps pero excluyendo metadata interna)
export function getDetailFields(schema: ModelSchema): FieldDefinition[] {
  const excludedFields = ["_id", "__v", "deleted", "isDeleted", "deletedAt"];

  return schema.fields.filter((field) => !excludedFields.includes(field.key));
}

// Función para obtener campos visibles en tabla
export function getTableFields(schema: ModelSchema): FieldDefinition[] {
  const priorityFields = ["name", "title", "email", "status"];
  const metadataFields = [
    "createdAt",
    "updatedAt",
    "deletedAt",
    "createdBy",
    "updatedBy",
    "deletedBy",
  ];
  const excludedFields = [
    "id",
    "_id",
    "__v",
    "deleted",
    "isDeleted",
    "deletedAt",
    "description",
    "content",
    "metadata",
  ];

  const filtered = schema.fields.filter((field) => !excludedFields.includes(field.key));

  // Separar campos en categorías
  const priority = filtered.filter((field) => priorityFields.includes(field.key));
  const metadata = filtered.filter((field) => metadataFields.includes(field.key));
  const regular = filtered.filter(
    (field) =>
      !priorityFields.includes(field.key) && !metadataFields.includes(field.key),
  );

  // Ordenar campos prioritarios según su posición en priorityFields
  const sortedPriority = priority.sort((a, b) => {
    const aIndex = priorityFields.indexOf(a.key);
    const bIndex = priorityFields.indexOf(b.key);
    return aIndex - bIndex;
  });

  // Ordenar campos de metadata según su posición en metadataFields
  const sortedMetadata = metadata.sort((a, b) => {
    const aIndex = metadataFields.indexOf(a.key);
    const bIndex = metadataFields.indexOf(b.key);
    return aIndex - bIndex;
  });

  // Devolver en orden: prioritarios, regulares, metadata
  return [...sortedPriority, ...regular, ...sortedMetadata];
}

class SchemaService {
  private schemaCache = new Map<string, ModelSchema>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private isCacheValid(modelName: string): boolean {
    const expiry = this.cacheExpiry.get(modelName);
    return expiry ? Date.now() < expiry : false;
  }

  async getModelSchema(modelName: string): Promise<ModelSchema> {
    // Verificar cache
    if (this.schemaCache.has(modelName) && this.isCacheValid(modelName)) {
      return this.schemaCache.get(modelName)!;
    }

    const response = await apiRequest<SchemaResponse>(`/schemas/${modelName}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || `Failed to fetch schema for ${modelName}`);
    }

    const schema = response.data;

    // Agregar propiedades de columna por defecto
    schema.fields = schema.fields.map((field) => ({
      ...field,
      sortable: !["object", "array"].includes(field.type),
      visible:
        !field.hidden && !["password", "token"].includes(field.key.toLowerCase()),
    }));

    // Guardar en cache
    this.schemaCache.set(modelName, schema);
    this.cacheExpiry.set(modelName, Date.now() + this.CACHE_DURATION);

    return schema;
  }

  async getAllSchemas(): Promise<Record<string, ModelSchema>> {
    const response = await apiRequest<{
      success: boolean;
      data: Record<string, ModelSchema>;
    }>("/schemas");

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch all schemas");
    }

    // Procesar y cachear todos los schemas
    Object.entries(response.data).forEach(([modelName, schema]) => {
      // Agregar propiedades de columna por defecto
      schema.fields = schema.fields.map((field) => ({
        ...field,
        sortable: !["object", "array"].includes(field.type),
        visible:
          !field.hidden && !["password", "token"].includes(field.key.toLowerCase()),
      }));

      this.schemaCache.set(modelName, schema);
      this.cacheExpiry.set(modelName, Date.now() + this.CACHE_DURATION);
    });

    return response.data;
  }

  async getModelNames(): Promise<
    Array<{ name: string; displayName: string; collection: string }>
  > {
    const response = await apiRequest<{
      success: boolean;
      data: Array<{ name: string; displayName: string; collection: string }>;
    }>("/schemas/models");

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch model names");
    }

    return response.data;
  }

  // Convertir FieldDefinition a ColumnConfig para compatibilidad
  fieldsToColumns(fields: FieldDefinition[]) {
    return fields.map((field) => ({
      key: field.key,
      type: field.type as any,
      sortable: field.sortable ?? true,
      visible: field.visible ?? true,
      label: field.label,
      required: field.required,
    }));
  }

  // Agregar método para obtener campos de tabla
  getTableFields(schema: ModelSchema): FieldDefinition[] {
    return getTableFields(schema);
  }

  clearCache(modelName?: string) {
    if (modelName) {
      this.schemaCache.delete(modelName);
      this.cacheExpiry.delete(modelName);
    } else {
      this.schemaCache.clear();
      this.cacheExpiry.clear();
    }
  }
}

export const schemaService = new SchemaService();
export default schemaService;
