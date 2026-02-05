// Serverless function wrapper para Vercel
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../src/models");
const routes = require("../src/routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();

// Configurar CORS para producción
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar conexión a BD en cold start (lazy connection)
let dbConnected = false;

const ensureDbConnection = async () => {
  if (!dbConnected) {
    try {
      await sequelize.authenticate();
      dbConnected = true;
      console.log("✅ Conexión a PostgreSQL establecida (serverless)");
    } catch (error) {
      console.error("❌ Error conectando a PostgreSQL:", error.message);
      throw error;
    }
  }
};

// Middleware para asegurar conexión a BD antes de procesar requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error de conexión a base de datos",
    });
  }
});

// Rutas API
app.use("/api", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenido a la API de Repartos SI",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      usuarios: "/api/usuarios",
      productos: "/api/productos",
      pedidos: "/api/pedidos",
      envios: "/api/envios",
      calificaciones: "/api/calificaciones",
      entregas: "/api/entregas",
      relaciones: "/api/relaciones",
      chat: "/api/chat",
      movimientos: "/api/movimientos",
      stock: "/api/stock",
    },
    nota: "WebSockets no disponibles en modo serverless. Usar polling para actualizaciones.",
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.path,
  });
});

// Manejo de errores
app.use(errorHandler);

// Exportar para Vercel serverless
module.exports = app;
