const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { auth, requireRole } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas para usuarios (obtener/crear su conversación con admin)
router.get("/mi-conversacion", chatController.getOCrearConversacion);

// Rutas para admin (ver todas las conversaciones)
router.get(
  "/conversaciones",
  requireRole("admin"),
  chatController.getConversaciones,
);

// Rutas comunes
router.get("/:conversacionId/mensajes", chatController.getMensajes);
router.post("/:conversacionId/mensajes", chatController.enviarMensaje);
router.put("/:conversacionId/leidos", chatController.marcarLeidos);
router.get("/no-leidos", chatController.getNoLeidos);

// Admin: cerrar conversación
router.put(
  "/:conversacionId/cerrar",
  requireRole("admin"),
  chatController.cerrarConversacion,
);

module.exports = router;
