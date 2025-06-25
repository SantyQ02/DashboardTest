import { Router } from "express";
import { SchemaController } from "../controllers/schemaController.js";

const router = Router();
const schemaController = new SchemaController();

// GET /api/schemas - Obtener todos los esquemas
router.get("/", schemaController.getAllSchemas.bind(schemaController));

// GET /api/schemas/models - Obtener nombres de modelos disponibles
router.get("/models", schemaController.getModelNames.bind(schemaController));

// GET /api/schemas/:modelName - Obtener esquema de un modelo específico
// @ts-ignore - Express v5 compatibility
router.get("/:modelName", schemaController.getModelSchema.bind(schemaController));

export default router;
