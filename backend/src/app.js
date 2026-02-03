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

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
    console.log("✅ Conexión a PostgreSQL establecida");

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
    console.log("✅ Socket.io inicializado");

    // Iniciar servidor HTTP con Socket.io
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 API disponible en http://localhost:${PORT}/api`);
      console.log(`💬 WebSocket disponible en ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
