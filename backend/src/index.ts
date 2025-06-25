import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import { connectDB } from "./services/db.js";
import { authenticateToken } from "./middleware/auth.js";

// Import Firebase config (it will auto-initialize)
import "./config/firebase.js";

// Importar rutas manuales
import authRoutes from "./routes/auth.js";
import schemasRoutes from "./routes/schemas.js";
import statsRoutes from "./routes/stats.js";

// Importar factories para generación automática
import { CrudRouterFactory } from "./factories/CrudRouterFactory.js";
import { MODELS_CONFIG } from "./config/models-config.js";
import models from "./models/index.js";

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de ping sin autenticación
app.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "SaveApp API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Rutas de autenticación sin prefijo /api
app.use("/auth", authRoutes);

// Rutas manuales
app.use("/api/schemas", authenticateToken, schemasRoutes);
app.use("/api/stats", authenticateToken, statsRoutes);

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos PRIMERO
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Verificar que los modelos están disponibles
    console.log("🔍 Available models:", Object.keys(models));

    // Generar automáticamente todas las rutas CRUD basadas en la configuración
    // DESPUÉS de conectar a la base de datos
    CrudRouterFactory.registerAllRoutes(app, models, MODELS_CONFIG, authenticateToken);
    console.log("🔧 All CRUD routes registered automatically");

    // IMPORTANTE: Registrar middlewares de error y 404 DESPUÉS de todas las rutas
    // Middleware de manejo de errores
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        console.error("Error:", err);
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      },
    );

    // Ruta 404 - DEBE ser la última
    app.use("/*splat", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 SaveApp API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Auth URL: http://localhost:${PORT}/auth`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔗 Ping URL: http://localhost:${PORT}/ping`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
