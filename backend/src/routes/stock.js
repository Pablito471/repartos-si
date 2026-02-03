const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const { auth } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

// GET /api/stock - Obtener stock agrupado del cliente
router.get("/", stockController.obtenerStock);

// GET /api/stock/detallado - Obtener stock con detalle de cada entrada
router.get("/detallado", stockController.obtenerStockDetallado);

// GET /api/stock/totales - Obtener totales del stock
router.get("/totales", stockController.obtenerTotales);

// GET /api/stock/historial - Obtener historial de entregas
router.get("/historial", stockController.obtenerHistorial);

// POST /api/stock/agregar - Agregar producto manualmente
router.post("/agregar", stockController.agregarProducto);

// POST /api/stock/agregar-desde-pedido/:pedidoId - Agregar desde pedido entregado
router.post(
  "/agregar-desde-pedido/:pedidoId",
  stockController.agregarDesdePedido,
);

// POST /api/stock/descontar - Descontar stock (venta)
router.post("/descontar", stockController.descontarStock);

// PUT /api/stock/:id - Actualizar un producto
router.put("/:id", stockController.actualizarStock);

// DELETE /api/stock/:id - Eliminar un producto
router.delete("/:id", stockController.eliminarProducto);

module.exports = router;
