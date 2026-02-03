const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const usuariosRoutes = require("./usuarios");
const productosRoutes = require("./productos");
const pedidosRoutes = require("./pedidos");
const enviosRoutes = require("./envios");
const calificacionesRoutes = require("./calificaciones");
const entregasRoutes = require("./entregas");
const relacionesRoutes = require("./relaciones");
const chatRoutes = require("./chat");

router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/productos", productosRoutes);
router.use("/pedidos", pedidosRoutes);
router.use("/envios", enviosRoutes);
router.use("/calificaciones", calificacionesRoutes);
router.use("/entregas", entregasRoutes);
router.use("/relaciones", relacionesRoutes);
router.use("/chat", chatRoutes);

// Ruta de health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
