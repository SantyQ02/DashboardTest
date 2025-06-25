import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/base/button";
import { Input } from "./ui/forms/input";
import { Label } from "./ui/forms/label";
import { Textarea } from "./ui/forms/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/forms/select";
import { Checkbox } from "./ui/forms/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/layout/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/layout/dialog";
import { Badge } from "./ui/data-display/badge";
import { Plus, X, Save, Loader2 } from "lucide-react";
import {
  schemaService,
  type FieldDefinition,
  type ModelSchema,
  getFormFields,
} from "../services/schema";

interface DynamicFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  modelName: string;
  initialData?: any;
  mode: "create" | "edit";
  title?: string;
  loading?: boolean;
}

export function DynamicForm({
  isOpen,
  onClose,
  onSubmit,
  modelName,
  initialData,
  mode,
  title,
  loading = false,
}: DynamicFormProps) {
  const [schema, setSchema] = useState<ModelSchema | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [arrayValues, setArrayValues] = useState<Record<string, string[]>>({});
  const [newArrayItems, setNewArrayItems] = useState<Record<string, string>>({});

  // Cargar esquema dinámicamente
  useEffect(() => {
    if (isOpen && modelName) {
      loadSchema();
    }
  }, [isOpen, modelName]);

  const loadSchema = async () => {
    try {
      setSchemaLoading(true);
      const modelSchema = await schemaService.getModelSchema(modelName);
      const formFields = getFormFields(modelSchema);

      setSchema(modelSchema);
      setFields(formFields);
    } catch (error) {
      console.error("Error loading schema:", error);
    } finally {
      setSchemaLoading(false);
    }
  };

  // Generar esquema de validación Zod dinámicamente
  const generateZodSchema = (fields: FieldDefinition[]) => {
    const zodFields: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
      if (field.readonly || field.hidden) return;

      let zodType: z.ZodTypeAny;

      switch (field.type) {
        case "text":
        case "email":
        case "url":
        case "textarea":
          zodType = z.string();
          if (field.validation?.min)
            zodType = (zodType as z.ZodString).min(field.validation.min);
          if (field.validation?.max)
            zodType = (zodType as z.ZodString).max(field.validation.max);
          if (field.type === "email") zodType = (zodType as z.ZodString).email();
          if (field.type === "url") zodType = (zodType as z.ZodString).url();
          break;

        case "number":
          zodType = z.number();
          if (field.validation?.min !== undefined)
            zodType = (zodType as z.ZodNumber).min(field.validation.min);
          if (field.validation?.max !== undefined)
            zodType = (zodType as z.ZodNumber).max(field.validation.max);
          break;

        case "boolean":
          zodType = z.boolean();
          break;

        case "date":
          zodType = z.date();
          break;

        case "select":
          if (field.validation?.enum) {
            zodType = z.enum(field.validation.enum as [string, ...string[]]);
          } else {
            zodType = z.string();
          }
          break;

        case "array":
          zodType = z.array(z.string());
          break;

        default:
          zodType = z.string();
      }

      if (!field.required) {
        zodType = zodType.optional();
      }

      zodFields[field.key] = zodType;
    });

    return z.object(zodFields);
  };

  const zodSchema = fields.length > 0 ? generateZodSchema(fields) : z.object({});

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<any>({
    resolver: zodResolver(zodSchema),
    defaultValues: getDefaultValues(fields, initialData),
  });

  // Inicializar valores de arrays
  useEffect(() => {
    if (initialData && fields.length > 0) {
      const arrayData: Record<string, string[]> = {};
      fields.forEach((field) => {
        if (field.type === "array" && initialData[field.key]) {
          arrayData[field.key] = Array.isArray(initialData[field.key])
            ? initialData[field.key]
            : [];
        }
      });
      setArrayValues(arrayData);
    }
  }, [initialData, fields]);

  function getDefaultValues(fields: FieldDefinition[], data?: any) {
    const defaults: Record<string, any> = {};

    fields.forEach((field) => {
      if (data && data[field.key] !== undefined) {
        defaults[field.key] = data[field.key];
      } else if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      } else {
        switch (field.type) {
          case "boolean":
            defaults[field.key] = false;
            break;
          case "number":
            defaults[field.key] = 0;
            break;
          case "array":
            defaults[field.key] = [];
            break;
          case "object":
            defaults[field.key] = {};
            break;
          default:
            defaults[field.key] = "";
        }
      }
    });

    return defaults;
  }

  const handleFormSubmit = async (data: any) => {
    try {
      // Combinar datos del formulario con arrays
      const finalData = { ...data, ...arrayValues };

      // Limpiar campos vacíos opcionales
      Object.keys(finalData).forEach((key) => {
        const field = fields.find((f) => f.key === key);
        if (!field?.required && (finalData[key] === "" || finalData[key] === null)) {
          delete finalData[key];
        }
      });

      await onSubmit(finalData);
      onClose();
      reset();
      setArrayValues({});
      setNewArrayItems({});
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const addArrayItem = (fieldKey: string) => {
    const newItem = newArrayItems[fieldKey];
    if (newItem && newItem.trim()) {
      setArrayValues((prev) => ({
        ...prev,
        [fieldKey]: [...(prev[fieldKey] || []), newItem.trim()],
      }));
      setNewArrayItems((prev) => ({
        ...prev,
        [fieldKey]: "",
      }));
    }
  };

  const removeArrayItem = (fieldKey: string, index: number) => {
    setArrayValues((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey]?.filter((_, i) => i !== index) || [],
    }));
  };

  const renderField = (field: FieldDefinition) => {
    const error = errors[field.key];
    const errorMessage = error?.message as string;

    const baseProps = {
      key: field.key,
      id: field.key,
      placeholder: field.placeholder,
      disabled: loading || isSubmitting,
    };

    switch (field.type) {
      case "text":
      case "email":
      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.key}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...baseProps}
                  {...formField}
                  type={
                    field.type === "email"
                      ? "email"
                      : field.type === "url"
                        ? "url"
                        : "text"
                  }
                />
              )}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.key}
              control={control}
              render={({ field: formField }) => (
                <Textarea {...baseProps} {...formField} rows={3} />
              )}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.key}
              control={control}
              render={({ field: formField }) => (
                <Input
                  {...baseProps}
                  {...formField}
                  type="number"
                  min={field.validation?.min}
                  max={field.validation?.max}
                  onChange={(e) => formField.onChange(Number(e.target.value) || 0)}
                />
              )}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "boolean":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Controller
                name={field.key}
                control={control}
                render={({ field: formField }) => (
                  <Checkbox
                    id={field.key}
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={loading || isSubmitting}
                  />
                )}
              />
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.key}
              control={control}
              render={({ field: formField }) => (
                <Select
                  value={formField.value}
                  onValueChange={formField.onChange}
                  disabled={loading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        field.placeholder || `Select ${field.label.toLowerCase()}`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "array":
        const currentArray = arrayValues[field.key] || [];
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {/* Items existentes */}
              {currentArray.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentArray.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem(field.key, index)}
                        className="ml-1 hover:text-destructive"
                        disabled={loading || isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input para nuevo item */}
              <div className="flex gap-2">
                <Input
                  placeholder={field.placeholder}
                  value={newArrayItems[field.key] || ""}
                  onChange={(e) =>
                    setNewArrayItems((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addArrayItem(field.key);
                    }
                  }}
                  disabled={loading || isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem(field.key)}
                  disabled={
                    loading || isSubmitting || !newArrayItems[field.key]?.trim()
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      case "object":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={field.key}
              control={control}
              render={({ field: formField }) => (
                <Textarea
                  {...baseProps}
                  {...formField}
                  value={
                    typeof formField.value === "object"
                      ? JSON.stringify(formField.value, null, 2)
                      : formField.value
                  }
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      formField.onChange(parsed);
                    } catch {
                      formField.onChange(e.target.value);
                    }
                  }}
                  placeholder="Enter valid JSON"
                  rows={4}
                />
              )}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (schemaLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <span className="font-bold text-foreground">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!schema || fields.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No form fields available for this model.
            </p>
            <p className="text-sm text-muted-foreground mt-2">Model: {modelName}</p>
            <p className="text-sm text-muted-foreground">
              Schema loaded: {schema ? "Yes" : "No"}
            </p>
            <p className="text-sm text-muted-foreground">
              Fields count: {fields.length}
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                console.log("=== DEBUG INFO ===");
                console.log("Model name:", modelName);
                console.log("Schema:", schema);
                console.log("Fields:", fields);
                try {
                  const testSchema = await schemaService.getModelSchema(modelName);
                  console.log("Fresh schema fetch result:", testSchema);
                } catch (error) {
                  console.error("Fresh schema fetch error:", error);
                }
              }}
              className="mt-2"
            >
              Debug Info
            </Button>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const groupedFields = fields.reduce(
    (groups, field) => {
      if (field.type === "object") {
        groups.complex.push(field);
      } else {
        groups.basic.push(field);
      }
      return groups;
    },
    { basic: [] as FieldDefinition[], complex: [] as FieldDefinition[] },
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || `${mode === "create" ? "Create" : "Edit"} ${schema.displayName}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Campos básicos */}
          {groupedFields.basic.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedFields.basic.map((field) => renderField(field))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campos complejos */}
          {groupedFields.complex.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedFields.complex.map((field) => renderField(field))}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isSubmitting}>
              {(loading || isSubmitting) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              {mode === "create" ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
