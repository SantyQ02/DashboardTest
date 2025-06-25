import { Request, Response } from "express";
import mongoose from "mongoose";
import models from "../models/index.js";
import { collections } from "../config/models-config.js";

export class SchemaController {
  // Mapeo de tipos de Mongoose a tipos de frontend
  private mapMongooseTypeToFieldType(schemaType: any): string {
    // Detectar subdocumentos embebidos (objetos anidados)
    if (schemaType.schema) {
      return "object";
    }
    // Detectar tipo Mixed explícito
    if (schemaType.instance === "Mixed" || schemaType.constructor?.name === "Mixed") {
      return "object";
    }
    // Detectar tipo Object plano
    if (schemaType.instance === "Object" || schemaType.constructor?.name === "Object") {
      return "object";
    }
    const typeName = schemaType.instance || schemaType.constructor.name;

    switch (typeName) {
      case "String":
        // Detectar tipos especiales basados en validaciones
        if (schemaType.validators) {
          for (const validator of schemaType.validators) {
            if (validator.type === "regexp" && validator.regexp) {
              const pattern = validator.regexp.source;
              if (pattern.includes("email") || pattern.includes("@")) return "email";
              if (pattern.includes("http") || pattern.includes("url")) return "url";
            }
          }
        }
        // Detectar por nombre del campo
        const path = schemaType.path?.toLowerCase() || "";
        if (path.includes("email")) return "email";
        if (
          path.includes("url") ||
          path.includes("website") ||
          path.includes("link") ||
          path.includes("logo")
        )
          return "url";
        if (path.includes("color") || path.includes("colour")) return "text"; // Could be color picker in future
        return "text";

      case "Number":
        return "number";

      case "Boolean":
        return "boolean";

      case "Date":
        return "date";

      case "Array":
        return "array";

      case "ObjectId":
        return "select"; // Para referencias

      case "Mixed":
      case "Object":
        // Detectar tipo weekdays basado en el nombre del campo
        const fieldPath = schemaType.path?.toLowerCase() || "";
        if (fieldPath === "availability") {
          return "weekdays";
        }
        return "object";

      default:
        return "text";
    }
  }

  // Extraer validaciones de un campo
  private extractValidations(schemaType: any) {
    const validations: any = {};

    if (schemaType.validators) {
      for (const validator of schemaType.validators) {
        switch (validator.type) {
          case "required":
            validations.required = true;
            break;
          case "minlength":
            validations.min = validator.minlength;
            break;
          case "maxlength":
            validations.max = validator.maxlength;
            break;
          case "min":
            validations.min = validator.min;
            break;
          case "max":
            validations.max = validator.max;
            break;
          case "regexp":
            validations.pattern = validator.regexp.source;
            break;
          case "enum":
            validations.enum = validator.enumValues;
            break;
        }
      }
    }

    // Validaciones adicionales del schema
    if (schemaType.options) {
      if (schemaType.options.required) validations.required = true;
      if (schemaType.options.min !== undefined)
        validations.min = schemaType.options.min;
      if (schemaType.options.max !== undefined)
        validations.max = schemaType.options.max;
      if (schemaType.options.minlength !== undefined)
        validations.min = schemaType.options.minlength;
      if (schemaType.options.maxlength !== undefined)
        validations.max = schemaType.options.maxlength;
      if (schemaType.options.enum) validations.enum = schemaType.options.enum;
    }

    return validations;
  }

  // Generar opciones para campos select (referencias)
  private async generateSelectOptions(modelName: string, refModel?: string) {
    if (!refModel) return [];

    try {
      // Buscar el modelo referenciado
      const RefModel = Object.values(models).find(
        (model) => model.modelName === refModel,
      );

      if (!RefModel) return [];

      // Obtener algunos registros para las opciones
      const records = await (RefModel as any)
        .find({ deleted: { $ne: true } })
        .limit(100)
        .lean();

      return records.map((record: any) => ({
        value: record._id.toString(),
        label: record.name || record.title || record._id.toString(),
      }));
    } catch (error) {
      return [];
    }
  }

  // Generar etiqueta amigable para un campo
  private generateFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, " $1") // Separar camelCase
      .replace(/^./, (str) => str.toUpperCase()) // Capitalizar primera letra
      .trim();
  }

  // Extraer esquema de un modelo
  private async extractModelSchema(modelName: string, model: any) {
    const schema = model.schema;
    const paths = schema.paths;
    const fields = [];

    for (const [fieldName, schemaType] of Object.entries(paths)) {
      // Saltar campos internos de Mongoose
      if (["__v", "_id"].includes(fieldName)) continue;

      let fieldType = this.mapMongooseTypeToFieldType(schemaType as any);
      // Fix temporal: Forzar type 'weekdays' para availability en Offer
      if (modelName === 'Offer' && fieldName === 'availability') {
        fieldType = 'weekdays';
      }
      const validations = this.extractValidations(schemaType);
      const isRequired = validations.required || false;

      let options = [];
      let arrayItemType = undefined;
      let nested = undefined;

      // Manejar referencias (ObjectId)
      if (fieldType === "select" && (schemaType as any).options?.ref) {
        const refModel = (schemaType as any).options.ref;
        options = await this.generateSelectOptions(modelName, refModel);
      }

      // Manejar enums
      if (validations.enum) {
        options = validations.enum.map((value: string) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
        }));
      }

      // Manejar arrays
      if (fieldType === "array" && (schemaType as any).schema) {
        const arraySchema = (schemaType as any).schema;
        if (arraySchema.paths && Object.keys(arraySchema.paths).length > 0) {
          // Array de objetos
          arrayItemType = "object";
        } else {
          // Array de primitivos
          arrayItemType = "text";
        }
      } else if (fieldType === "array") {
        arrayItemType = "text";
      }

      // Si el campo es un objeto (subdocumento embebido), extraer sus subcampos recursivamente
      if (fieldType === "object" && (schemaType.schema || schemaType.caster?.schema)) {
        // Soportar subdocumentos embebidos y Mixed
        const subSchema = schemaType.schema || schemaType.caster?.schema;
        if (subSchema && subSchema.paths) {
          nested = [];
          for (const [subFieldName, subSchemaType] of Object.entries(subSchema.paths)) {
            if (["__v", "_id"].includes(subFieldName)) continue;
            const subFieldType = this.mapMongooseTypeToFieldType(subSchemaType);
            const subValidations = this.extractValidations(subSchemaType);
            const subIsRequired = subValidations.required || false;
            let subOptions = [];
            let subArrayItemType = undefined;
            // Recursividad para objetos anidados
            let subNested = undefined;
            if (subFieldType === "object" && (subSchemaType.schema || subSchemaType.caster?.schema)) {
              const subSubSchema = subSchemaType.schema || subSchemaType.caster?.schema;
              if (subSubSchema && subSubSchema.paths) {
                subNested = [];
                for (const [subSubFieldName, subSubSchemaType] of Object.entries(subSubSchema.paths)) {
                  if (["__v", "_id"].includes(subSubFieldName)) continue;
                  const subSubFieldType = this.mapMongooseTypeToFieldType(subSubSchemaType);
                  const subSubValidations = this.extractValidations(subSubSchemaType);
                  const subSubIsRequired = subSubValidations.required || false;
                  subNested.push({
                    key: subSubFieldName,
                    label: this.generateFieldLabel(subSubFieldName),
                    type: subSubFieldType,
                    required: subSubIsRequired,
                    placeholder: this.generatePlaceholder(subSubFieldName, subSubFieldType),
                    description: (subSubSchemaType as any).options?.description || undefined,
                    options: undefined,
                    validation: Object.keys(subSubValidations).length > 0 ? subSubValidations : undefined,
                    defaultValue: (subSubSchemaType as any).options?.default,
                    readonly: false,
                    hidden: false,
                    arrayItemType: undefined,
                  });
                }
              }
            }
            nested.push({
              key: subFieldName,
              label: this.generateFieldLabel(subFieldName),
              type: subFieldType,
              required: subIsRequired,
              placeholder: this.generatePlaceholder(subFieldName, subFieldType),
              description: (subSchemaType as any).options?.description || undefined,
              options: subOptions.length > 0 ? subOptions : undefined,
              validation: Object.keys(subValidations).length > 0 ? subValidations : undefined,
              defaultValue: (subSchemaType as any).options?.default,
              readonly: ["createdAt", "updatedAt"].includes(fieldName),
              hidden: fieldName === "_id",
              arrayItemType,
              nested: subNested,
            });
          }
        }
      }

      const field = {
        key: fieldName,
        label: this.generateFieldLabel(fieldName),
        type: fieldType,
        required: isRequired,
        placeholder: this.generatePlaceholder(fieldName, fieldType),
        description: (schemaType as any).options?.description || undefined,
        options: options.length > 0 ? options : undefined,
        validation: Object.keys(validations).length > 0 ? validations : undefined,
        defaultValue: (schemaType as any).options?.default,
        readonly: ["createdAt", "updatedAt"].includes(fieldName),
        hidden: fieldName === "_id",
        arrayItemType,
        nested,
      };

      fields.push(field);
    }

    return {
      name: modelName.toLowerCase(),
      displayName: modelName,
      primaryKey: "_id",
      timestamps: schema.options.timestamps || false,
      fields,
    };
  }

  // Generar placeholder basado en el nombre y tipo de campo
  private generatePlaceholder(fieldName: string, fieldType: string): string {
    const lowerName = fieldName.toLowerCase();

    switch (fieldType) {
      case "email":
        return "example@domain.com";
      case "url":
        return "https://example.com";
      case "number":
        if (lowerName.includes("phone")) return "+1234567890";
        if (lowerName.includes("amount") || lowerName.includes("fee")) return "0.00";
        return "0";
      case "textarea":
        return `Enter ${this.generateFieldLabel(fieldName).toLowerCase()}`;
      case "select":
        return `Select ${this.generateFieldLabel(fieldName).toLowerCase()}`;
      case "array":
        return `Enter ${this.generateFieldLabel(fieldName).toLowerCase()} and press Enter`;
      default:
        return `Enter ${this.generateFieldLabel(fieldName).toLowerCase()}`;
    }
  }

  // Endpoint para obtener el esquema de un modelo específico
  async getModelSchema(req: Request, res: Response) {
    try {
      const { modelName } = req.params;

      // Buscar la información de la colección usando collectionName o modelName
      let collectionInfo = Object.values(collections).find(
        (col) => col.collectionName === modelName.toLowerCase()
      );

      // Si no se encuentra por collectionName, buscar por modelName (Title Case)
      if (!collectionInfo) {
        collectionInfo = Object.values(collections).find(
          (col) => col.modelName === modelName
        );
      }

      // Si aún no se encuentra, buscar por modelName en lowercase
      if (!collectionInfo) {
        collectionInfo = Object.values(collections).find(
          (col) => col.modelName.toLowerCase() === modelName.toLowerCase()
        );
      }

      if (!collectionInfo) {
        return res.status(404).json({
          success: false,
          message: `Collection/Model '${modelName}' not found. Available: ${Object.values(collections).map(col => `${col.collectionName} (${col.modelName})`).join(", ")}`,
        });
      }

      // Obtener el modelo usando el modelName de la colección
      const model = models[collectionInfo.modelName as keyof typeof models];

      if (!model) {
        return res.status(404).json({
          success: false,
          message: `Model '${collectionInfo.modelName}' not found. Available models: ${Object.keys(models).join(", ")}`,
        });
      }

      const schema = await this.extractModelSchema(collectionInfo.modelName, model);

      res.json({
        success: true,
        data: schema,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error extracting model schema",
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  }

  // Endpoint para obtener todos los esquemas disponibles
  async getAllSchemas(req: Request, res: Response) {
    try {
      const schemas: Record<string, any> = {};

      for (const [modelName, model] of Object.entries(models)) {
        schemas[modelName.toLowerCase()] = await this.extractModelSchema(
          modelName,
          model,
        );
      }

      res.json({
        success: true,
        data: schemas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error extracting schemas",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // Endpoint para obtener solo los nombres de modelos disponibles
  async getModelNames(req: Request, res: Response) {
    try {
      const modelNames = Object.values(collections).map((collectionInfo) => ({
        name: collectionInfo.collectionName,
        displayName: collectionInfo.modelName,
        collection: collectionInfo.collectionName,
        modelName: collectionInfo.modelName,
      }));

      res.json({
        success: true,
        data: modelNames,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error getting model names",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
