const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { auth, requireRole } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

router.get("/", pedidosController.getPedidos);
router.get("/:id", pedidosController.getPedido);
router.post("/", requireRole("cliente"), pedidosController.crearPedido);
router.put("/:id", pedidosController.actualizarPedido);
router.put(
  "/:id/estado",
  requireRole("deposito", "admin", "flete"),
  pedidosController.cambiarEstado,
);
router.delete("/:id", pedidosController.cancelarPedido);

module.exports = router;
