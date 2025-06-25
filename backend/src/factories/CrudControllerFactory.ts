import { Request, Response } from "express";
import { Model, Document } from "mongoose";
import { ModelConfig, isFeatureEnabled } from "../config/models-config.js";

interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface FilterParams {
  search?: string;
  [key: string]: any;
}

export class CrudControllerFactory {
  private model: Model<any>;
  private modelName: string;
  private config: ModelConfig;

  constructor(model: Model<any>, modelName: string, config: ModelConfig) {
    this.model = model;
    this.modelName = modelName;
    this.config = config;
  }

  // Helper para construir query de búsqueda
  private buildSearchQuery(search?: string) {
    if (!search) return {};

    // Usar campos específicos del modelo o campos por defecto
    const searchFields = this.config.searchFields || ["name", "title", "description"];

    const searchQueries = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    }));

    return { $or: searchQueries };
  }

  // Helper para extraer parámetros de paginación de la request
  private getPaginationParams(req: Request): PaginationParams {
    return {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sort as string,
      sortOrder: req.query.order as "asc" | "desc",
    };
  }

  // Helper para construir query de filtros básicos (sin soft delete)
  private buildFilterQuery(filters: FilterParams) {
    const query: any = {};

    Object.keys(filters).forEach((key) => {
      if (["search", "page", "limit", "sort", "order"].includes(key)) return; // Excluir parámetros especiales

      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") {
        query[key] = value;
      }
    });

    return query;
  }

  // Helper para construir query completa con soft delete y búsqueda
  private buildCompleteQuery(
    filters: FilterParams,
    search?: string,
    includeDeleted = false,
  ) {
    const conditions: any[] = [];

    // Soft delete condition
    if (includeDeleted) {
      // Para registros eliminados, ser más específico
      conditions.push({ deleted: { $eq: true } });
    } else {
      // Para registros activos
      conditions.push({
        $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }],
      });
    }

    // Filter conditions
    const filterQuery = this.buildFilterQuery(filters);
    if (Object.keys(filterQuery).length > 0) {
      conditions.push(filterQuery);
    }

    // Search conditions
    if (search && search.trim() && isFeatureEnabled(this.config.name, "search")) {
      const searchQuery = this.buildSearchQuery(search.trim());
      if (Object.keys(searchQuery).length > 0) {
        conditions.push(searchQuery);
      }
    }

    // Si solo hay una condición, devolverla directamente
    // Si hay múltiples condiciones, usar $and
    // Si no hay condiciones, devolver query vacío (esto no debería pasar)
    if (conditions.length === 1) {
      return conditions[0];
    } else if (conditions.length > 1) {
      return { $and: conditions };
    } else {
      return {}; // Fallback - devolver todos los documentos
    }
  }

  // Helper para construir opciones de ordenamiento
  private buildSortOptions(
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): { [key: string]: 1 | -1 } {
    if (!sortBy) return { createdAt: -1 as const }; // Por defecto, más recientes primero

    return { [sortBy]: sortOrder === "desc" ? (-1 as const) : (1 as const) };
  }

  // Helper para normalizar availability a Weekdays
  private normalizeAvailability(availability: any): any {
    if (!availability || typeof availability !== 'object') return undefined;
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const result: Record<string, boolean> = {};
    days.forEach(day => {
      result[day] = Boolean(availability[day]);
    });
    return result;
  }

  // GET - Obtener todos los registros con paginación
  getAll = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "read")) {
      return res.status(403).json({
        success: false,
        message: "Read operation not allowed for this model",
      });
    }

    try {
      // Extraer parámetros usando la interfaz PaginationParams
      const { page, limit, sortBy, sortOrder } = this.getPaginationParams(req);
      const search = req.query.search as string;

      // Construir query completa
      const query = this.buildCompleteQuery(req.query as FilterParams, search, false);
      const sortOptions = this.buildSortOptions(sortBy, sortOrder);

      // Ejecutar consultas en paralelo
      let [records, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.model.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: records,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error(`Error fetching ${this.modelName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error fetching ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // GET - Obtener registros eliminados (papelera)
  getDeleted = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "viewTrash")) {
      return res.status(403).json({
        success: false,
        message: "Trash view not allowed for this model",
      });
    }

    try {
      // Extraer parámetros usando la interfaz PaginationParams
      const { page, limit, sortBy, sortOrder } = this.getPaginationParams(req);
      const search = req.query.search as string;

      // Construir query para registros eliminados
      const query = this.buildCompleteQuery(req.query as FilterParams, search, true);
      const sortOptions = this.buildSortOptions(sortBy, sortOrder);

      const [records, total] = await Promise.all([
        this.model
          .find(query)
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.model.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: records,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error(`Error fetching deleted ${this.modelName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error fetching deleted ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // GET - Obtener por ID
  getById = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "read")) {
      return res.status(403).json({
        success: false,
        message: "Read operation not allowed for this model",
      });
    }

    try {
      const { id } = req.params;
      const record = await this.model
        .findOne({
          _id: id,
          $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }],
        })
        .lean();

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`,
        });
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error(`Error fetching ${this.modelName} by ID:`, error);
      res.status(500).json({
        success: false,
        message: `Error fetching ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // POST - Crear nuevo registro
  create = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "create")) {
      return res.status(403).json({
        success: false,
        message: "Create operation not allowed for this model",
      });
    }

    try {
      const recordData = req.body;
      const newRecord = new this.model(recordData);
      const savedRecord = await newRecord.save();

      res.status(201).json({
        success: true,
        data: savedRecord,
        message: `${this.modelName} created successfully`,
      });
    } catch (error) {
      console.error(`Error creating ${this.modelName}:`, error);
      res.status(400).json({
        success: false,
        message: `Error creating ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // PUT - Actualizar registro
  update = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "update")) {
      return res.status(403).json({
        success: false,
        message: "Update operation not allowed for this model",
      });
    }

    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedRecord = await this.model
        .findOneAndUpdate(
          {
            _id: id,
            $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }],
          },
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true },
        )
        .lean();

      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`,
        });
      }

      res.json({
        success: true,
        data: updatedRecord,
        message: `${this.modelName} updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${this.modelName}:`, error);
      res.status(400).json({
        success: false,
        message: `Error updating ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // DELETE - Eliminar registro (soft delete)
  delete = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "delete")) {
      return res.status(403).json({
        success: false,
        message: "Delete operation not allowed for this model",
      });
    }

    try {
      const { id } = req.params;

      const deletedRecord = await this.model
        .findOneAndUpdate(
          {
            _id: id,
            $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }],
          },
          { deleted: true },
          { new: true },
        )
        .lean();

      if (!deletedRecord) {
        return res.status(404).json({
          success: false,
          message: `${this.modelName} not found`,
        });
      }

      res.json({
        success: true,
        message: `${this.modelName} deleted successfully`,
      });
    } catch (error) {
      console.error(`Error deleting ${this.modelName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error deleting ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // PATCH - Restaurar registro
  restore = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "restore")) {
      return res.status(403).json({
        success: false,
        message: "Restore operation not allowed for this model",
      });
    }

    try {
      const { id } = req.params;

      const restoredRecord = await this.model
        .findOneAndUpdate(
          { _id: id, deleted: true },
          { $unset: { deleted: 1 } },
          { new: true },
        )
        .lean();

      if (!restoredRecord) {
        return res.status(404).json({
          success: false,
          message: `Deleted ${this.modelName} not found`,
        });
      }

      res.json({
        success: true,
        data: restoredRecord,
        message: `${this.modelName} restored successfully`,
      });
    } catch (error) {
      console.error(`Error restoring ${this.modelName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error restoring ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // POST - Bulk create
  bulkCreate = async (req: Request, res: Response) => {
    if (
      !isFeatureEnabled(this.config.name, "bulkOperations") ||
      !isFeatureEnabled(this.config.name, "import")
    ) {
      return res.status(403).json({
        success: false,
        message: "Bulk operations not allowed for this model",
      });
    }

    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Records array is required",
        });
      }

      const createdRecords = await this.model.insertMany(records, { ordered: false });

      res.json({
        success: true,
        data: createdRecords,
        message: `${createdRecords.length} ${this.modelName} records created successfully`,
      });
    } catch (error) {
      console.error(`Error bulk creating ${this.modelName}:`, error);
      res.status(400).json({
        success: false,
        message: `Error bulk creating ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // POST - Validate bulk data
  validateBulkData = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "bulkOperations")) {
      return res.status(403).json({
        success: false,
        message: "Bulk operations not allowed for this model",
      });
    }

    try {
      const { records } = req.body;
      const errors: string[] = [];

      if (!Array.isArray(records)) {
        return res.json({
          success: true,
          data: { valid: false, errors: ["Records must be an array"] },
        });
      }

      // Validar cada registro usando el esquema de Mongoose
      for (let i = 0; i < records.length; i++) {
        try {
          const testRecord = new this.model(records[i]);
          await testRecord.validate();
        } catch (validationError: any) {
          if (validationError.errors) {
            Object.keys(validationError.errors).forEach((field) => {
              errors.push(
                `Row ${i + 1}, ${field}: ${validationError.errors[field].message}`,
              );
            });
          } else {
            errors.push(`Row ${i + 1}: ${validationError.message}`);
          }
        }
      }

      res.json({
        success: true,
        data: {
          valid: errors.length === 0,
          errors,
        },
      });
    } catch (error) {
      console.error(`Error validating ${this.modelName} data:`, error);
      res.status(500).json({
        success: false,
        message: `Error validating ${this.modelName} data`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };

  // GET - Export data
  exportData = async (req: Request, res: Response) => {
    if (!isFeatureEnabled(this.config.name, "export")) {
      return res.status(403).json({
        success: false,
        message: "Export operation not allowed for this model",
      });
    }

    try {
      const format = (req.query.format as string) || "json";
      const useFilters = req.query.useFilters === "true";

      let query = { deletedAt: null };

      if (useFilters) {
        query = this.buildFilterQuery(req.query as FilterParams);
        const search = req.query.search as string;
        if (search && isFeatureEnabled(this.config.name, "search")) {
          const searchQuery = this.buildSearchQuery(search);
          query = { ...query, ...searchQuery };
        }
      }

      const records = await this.model.find(query).lean();

      if (format === "csv") {
        // Convertir a CSV
        if (records.length === 0) {
          return res.json({ success: true, data: "", headers: {} });
        }

        const headers = Object.keys(records[0]);
        const csvHeaders = headers.join(",");
        const csvRows = records.map((record) =>
          headers
            .map((header) => {
              const value = (record as any)[header];
              return typeof value === "string"
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(","),
        );
        const csvContent = [csvHeaders, ...csvRows].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${this.modelName}_export.csv"`,
        );
        return res.send(csvContent);
      }

      res.json({
        success: true,
        data: records,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(`Error exporting ${this.modelName}:`, error);
      res.status(500).json({
        success: false,
        message: `Error exporting ${this.modelName}`,
        error:
          process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      });
    }
  };
}
