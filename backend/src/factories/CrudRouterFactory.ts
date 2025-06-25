import { Router } from "express";
import { Model } from "mongoose";
import { CrudControllerFactory } from "./CrudControllerFactory.js";
import { ModelConfig, isFeatureEnabled, collections } from "../config/models-config.js";

export class CrudRouterFactory {
  static createRouter(
    model: Model<any>,
    modelName: string,
    config: ModelConfig,
  ): Router {
    const router = Router();
    const controller = new CrudControllerFactory(model, modelName, config);

    // GET /{model} - Obtener todos los registros
    if (isFeatureEnabled(config.name, "read")) {
      router.get("/", controller.getAll.bind(controller));
    }

    // GET /{model}/deleted - Obtener registros eliminados
    if (isFeatureEnabled(config.name, "viewTrash")) {
      router.get("/deleted", controller.getDeleted.bind(controller));
    }

    // GET /{model}/export - Exportar datos
    if (isFeatureEnabled(config.name, "export")) {
      router.get("/export", controller.exportData.bind(controller));
    }

    // GET /{model}/:id - Obtener por ID
    if (isFeatureEnabled(config.name, "read")) {
      router.get("/:id", controller.getById.bind(controller));
    }

    // POST /{model} - Crear nuevo registro
    if (isFeatureEnabled(config.name, "create")) {
      router.post("/", controller.create.bind(controller));
    }

    // POST /{model}/bulk - Crear múltiples registros
    if (
      isFeatureEnabled(config.name, "bulkOperations") &&
      isFeatureEnabled(config.name, "import")
    ) {
      router.post("/bulk", controller.bulkCreate.bind(controller));
    }

    // POST /{model}/validate - Validar datos para importación
    if (isFeatureEnabled(config.name, "bulkOperations")) {
      router.post("/validate", controller.validateBulkData.bind(controller));
    }

    // PUT /{model}/:id - Actualizar registro
    if (isFeatureEnabled(config.name, "update")) {
      router.put("/:id", controller.update.bind(controller));
    }

    // DELETE /{model}/:id - Eliminar registro (soft delete)
    if (isFeatureEnabled(config.name, "delete")) {
      router.delete("/:id", controller.delete.bind(controller));
    }

    // PATCH /{model}/:id/restore - Restaurar registro
    if (isFeatureEnabled(config.name, "restore")) {
      router.patch("/:id/restore", controller.restore.bind(controller));
    }

    return router;
  }

  // Método para registrar todas las rutas automáticamente
  static registerAllRoutes(
    app: any,
    models: Record<string, Model<any>>,
    configs: Record<string, ModelConfig>,
    authenticateToken: any,
  ) {
    Object.keys(configs).forEach((modelKey) => {
      const config = configs[modelKey];

      // Buscar el modelo usando la variable collections del paquete shared
      const collectionInfo = Object.values(collections).find(
        (col) => col.collectionName === config.name,
      );

      if (!collectionInfo) {
        return;
      }

      const model = models[collectionInfo.modelName];

      if (!model) {
        return;
      }

      const router = CrudRouterFactory.createRouter(
        model,
        collectionInfo.modelName,
        config,
      );

      // Registrar las rutas con autenticación
      const routePath = `/api/${config.name}`;
      app.use(routePath, authenticateToken, router);
    });
  }
}
