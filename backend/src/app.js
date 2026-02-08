// Repartos-SI Backend - v2.2 (seguridad mejorada)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { sequelize } = require("./models");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const { initSocket } = require("./socket");
const logger = require("./config/logger");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configurar orígenes permitidos para CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Seguridad: Headers HTTP
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Deshabilitado para compatibilidad con frontend
  }),
);

// Rate Limiting: Prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máx 100 requests por ventana
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor, intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health", // Excluir health check
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      // Verificar si el origin está permitido o es un subdominio de vercel.app
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Parseo de body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas
app.use("/api", routes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenido a la API de Repartos SI",
    version: "1.0.0",
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
    },
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
});

// Manejo de errores
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    logger.info("✅ Base de datos conectada");

    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      logger.info(
        "📝 Modo desarrollo - usar npm run db:seed para sincronizar tablas",
      );
    }

    // Inicializar Socket.io
    initSocket(server);

    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
      logger.info(`🔒 Helmet y Rate Limiting activos`);
    });
  } catch (error) {
    logger.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
