// Repartos-SI Backend - v2.1 (columna imagen en stock_clientes)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { sequelize } = require("./models");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configurar orígenes permitidos para CORS
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middlewares
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    // Sincronizar modelos (solo en desarrollo)
    // NOTA: Las tablas ya fueron creadas con el seed, no usar alter: true
    // ya que causa problemas con columnas SERIAL
    if (process.env.NODE_ENV === "development") {
      // No sincronizar automáticamente, usar seed.js para recrear tablas
      console.log(
        "✅ Base de datos conectada (usar npm run db:seed para sincronizar tablas)",
      );
    }

    // Inicializar Socket.io
    initSocket(server);
    // Iniciar servidor HTTP con Socket.io
    server.listen(PORT, () => {
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
