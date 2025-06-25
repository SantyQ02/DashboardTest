import { Router } from "express";
import { getStats } from "../controllers/statsController.js";

const router = Router();

// GET /api/stats - Obtener estadísticas del dashboard
router.get("/", getStats);

export default router;
