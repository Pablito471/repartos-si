const express = require("express");
const router = express.Router();
const movimientosController = require("../controllers/movimientosController");
const { auth } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

// GET /api/movimientos - Listar movimientos del usuario
router.get("/", movimientosController.listar);

// GET /api/movimientos/totales - Obtener totales y estadísticas
router.get("/totales", movimientosController.obtenerTotales);

// GET /api/movimientos/:id - Obtener movimiento por ID
router.get("/:id", movimientosController.obtenerPorId);

// POST /api/movimientos - Crear nuevo movimiento
router.post("/", movimientosController.crear);

// POST /api/movimientos/registrar-pedido - Registrar movimiento de pedido
router.post("/registrar-pedido", movimientosController.registrarPedido);

// PUT /api/movimientos/:id - Actualizar movimiento
router.put("/:id", movimientosController.actualizar);

// DELETE /api/movimientos/:id - Eliminar movimiento
router.delete("/:id", movimientosController.eliminar);

module.exports = router;
