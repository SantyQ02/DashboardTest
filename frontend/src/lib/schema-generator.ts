import { z } from "zod";

export type FieldType =
  | "text"
  | "email"
  | "url"
  | "number"
  | "boolean"
  | "date"
  | "textarea"
  | "select"
  | "multiselect"
  | "array"
  | "object";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  defaultValue?: any;
  hidden?: boolean;
  readonly?: boolean;
  nested?: FieldConfig[]; // Para objetos anidados
  arrayItemType?: FieldType; // Para arrays
  arrayItemSchema?: FieldConfig[]; // Para arrays de objetos
}

export interface ModelSchema {
  name: string;
  displayName: string;
  fields: FieldConfig[];
  primaryKey: string;
  timestamps: boolean;
}

// Esquemas predefinidos para cada modelo
export const modelSchemas: Record<string, ModelSchema> = {
  banks: {
    name: "banks",
    displayName: "Bank",
    primaryKey: "_id",
    timestamps: true,
    fields: [
      {
        key: "name",
        label: "Bank Name",
        type: "text",
        required: true,
        placeholder: "Enter bank name",
        validation: { min: 2, max: 100 },
      },
      {
        key: "code",
        label: "Bank Code",
        type: "text",
        required: true,
        placeholder: "Enter bank code (e.g., SAN)",
        validation: { min: 2, max: 10, pattern: "^[A-Z0-9]+$" },
      },
      {
        key: "logo",
        label: "Logo URL",
        type: "url",
        placeholder: "https://example.com/logo.png",
      },
      {
        key: "website",
        label: "Website",
        type: "url",
        placeholder: "https://bank-website.com",
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "_id",
        label: "ID",
        type: "text",
        readonly: true,
        hidden: true,
      },
      {
        key: "createdAt",
        label: "Created At",
        type: "date",
        readonly: true,
      },
      {
        key: "updatedAt",
        label: "Updated At",
        type: "date",
        readonly: true,
      },
    ],
  },
  cards: {
    name: "cards",
    displayName: "Card",
    primaryKey: "_id",
    timestamps: true,
    fields: [
      {
        key: "name",
        label: "Card Name",
        type: "text",
        required: true,
        placeholder: "Enter card name",
      },
      {
        key: "bankId",
        label: "Bank",
        type: "select",
        required: true,
        options: [], // Se llenarán dinámicamente
      },
      {
        key: "cardType",
        label: "Card Type",
        type: "select",
        required: true,
        options: [
          { value: "credit", label: "Credit Card" },
          { value: "debit", label: "Debit Card" },
        ],
      },
      {
        key: "benefits",
        label: "Benefits",
        type: "array",
        arrayItemType: "text",
        placeholder: "Enter benefit and press Enter",
      },
      {
        key: "annualFee",
        label: "Annual Fee",
        type: "number",
        validation: { min: 0 },
      },
      {
        key: "cashbackRate",
        label: "Cashback Rate (%)",
        type: "number",
        validation: { min: 0, max: 100 },
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  categories: {
    name: "categories",
    displayName: "Category",
    primaryKey: "_id",
    timestamps: true,
    fields: [
      {
        key: "name",
        label: "Category Name",
        type: "text",
        required: true,
        placeholder: "Enter category name",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter category description",
      },
      {
        key: "icon",
        label: "Icon",
        type: "text",
        placeholder: "Enter icon name or URL",
      },
      {
        key: "parentId",
        label: "Parent Category",
        type: "select",
        options: [], // Se llenarán dinámicamente
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  stores: {
    name: "stores",
    displayName: "Store",
    primaryKey: "_id",
    timestamps: true,
    fields: [
      {
        key: "name",
        label: "Store Name",
        type: "text",
        required: true,
        placeholder: "Enter store name",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter store description",
      },
      {
        key: "address",
        label: "Address",
        type: "text",
        placeholder: "Enter store address",
      },
      {
        key: "phone",
        label: "Phone",
        type: "text",
        placeholder: "+1234567890",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        placeholder: "store@example.com",
      },
      {
        key: "website",
        label: "Website",
        type: "url",
        placeholder: "https://store-website.com",
      },
      {
        key: "logo",
        label: "Logo URL",
        type: "url",
        placeholder: "https://example.com/logo.png",
      },
      {
        key: "brandId",
        label: "Brand",
        type: "select",
        options: [], // Se llenarán dinámicamente
      },
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        required: true,
        options: [], // Se llenarán dinámicamente
      },
      {
        key: "coordinates",
        label: "Coordinates",
        type: "object",
        nested: [
          {
            key: "lat",
            label: "Latitude",
            type: "number",
            validation: { min: -90, max: 90 },
          },
          {
            key: "lng",
            label: "Longitude",
            type: "number",
            validation: { min: -180, max: 180 },
          },
        ],
      },
      {
        key: "openingHours",
        label: "Opening Hours",
        type: "object",
        description: "Store opening hours for each day",
      },
      {
        key: "isActive",
        label: "Active",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
};

// Función para generar validación Zod basada en el esquema
export function generateZodSchema(schema: ModelSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  schema.fields.forEach((field) => {
    if (field.hidden || field.readonly) return;

    let zodField: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
        zodField = z.string();
        if (field.validation?.min)
          zodField = (zodField as z.ZodString).min(field.validation.min);
        if (field.validation?.max)
          zodField = (zodField as z.ZodString).max(field.validation.max);
        if (field.validation?.pattern) {
          zodField = (zodField as z.ZodString).regex(
            new RegExp(field.validation.pattern),
          );
        }
        break;
      case "email":
        zodField = z.string().email("Please enter a valid email address");
        break;
      case "url":
        zodField = z.string().url("Please enter a valid URL").or(z.literal(""));
        break;
      case "number":
        zodField = z.number();
        if (field.validation?.min !== undefined)
          zodField = (zodField as z.ZodNumber).min(field.validation.min);
        if (field.validation?.max !== undefined)
          zodField = (zodField as z.ZodNumber).max(field.validation.max);
        break;
      case "boolean":
        zodField = z.boolean();
        break;
      case "date":
        zodField = z.date();
        break;
      case "select":
        if (field.options && field.options.length > 0) {
          const values = field.options.map((opt) => opt.value);
          zodField = z.enum(values as [string, ...string[]]);
        } else {
          zodField = z.string();
        }
        break;
      case "multiselect":
        zodField = z.array(z.string());
        break;
      case "array":
        if (field.arrayItemType === "text") {
          zodField = z.array(z.string());
        } else {
          zodField = z.array(z.any());
        }
        break;
      case "object":
        if (field.nested) {
          const nestedShape: Record<string, z.ZodTypeAny> = {};
          field.nested.forEach((nestedField) => {
            // Recursivamente crear validación para campos anidados
            const nestedSchema = { ...schema, fields: [nestedField] };
            const nestedZod = generateZodSchema(nestedSchema);
            nestedShape[nestedField.key] = nestedZod.shape[nestedField.key];
          });
          zodField = z.object(nestedShape);
        } else {
          zodField = z.record(z.any());
        }
        break;
      default:
        zodField = z.any();
    }

    if (!field.required) {
      zodField = zodField.optional();
    }

    shape[field.key] = zodField;
  });

  return z.object(shape);
}

// Función para obtener el esquema de un modelo
export function getModelSchema(modelName: string): ModelSchema | null {
  return modelSchemas[modelName] || null;
}

// Función para obtener campos visibles para la tabla
export function getTableFields(modelName: string): FieldConfig[] {
  const schema = getModelSchema(modelName);
  if (!schema) return [];

  return schema.fields.filter(
    (field) =>
      !field.hidden &&
      !["_id"].includes(field.key) &&
      field.type !== "object" &&
      field.type !== "array", // Los objetos y arrays complejos no se muestran en tabla
  );
}

// Función para obtener campos editables para formularios
export function getFormFields(modelName: string): FieldConfig[] {
  const schema = getModelSchema(modelName);
  if (!schema) return [];

  const excludedFields = [
    "_id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "deleted",
    "deletedBy",
    "__v",
  ];
  return schema.fields.filter(
    (field) => !field.hidden && !field.readonly && !excludedFields.includes(field.key),
  );
}

// Función para obtener todos los campos para vista detallada
export function getDetailFields(modelName: string): FieldConfig[] {
  const schema = getModelSchema(modelName);
  if (!schema) return [];

  return schema.fields.filter((field) => !field.hidden);
}
