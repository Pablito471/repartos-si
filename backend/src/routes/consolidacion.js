const express = require("express");
const router = express.Router();
const consolidacionController = require("../controllers/consolidacionController");
const { auth, requireRole } = require("../middleware/auth");

// Todas las rutas requieren autenticación y rol de depósito o admin

// POST /api/consolidacion/relacionar - Relacionar dos productos por códigos de barras
router.post(
  "/relacionar",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.relacionarProductos,
);

// GET /api/consolidacion/productos/:productoId - Obtener producto con stock consolidado
router.get(
  "/productos/:productoId",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.getProductoConsolidado,
);

// POST /api/consolidacion/consolidar - Consolidar stock de productos relacionados
router.post(
  "/consolidar",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.consolidarStock,
);

// POST /api/consolidacion/agregar-stock - Agregar stock de un producto con nuevo código de barras
router.post(
  "/agregar-stock",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.agregarStockConsolidado,
);

// GET /api/consolidacion/relaciones - Obtener todas las relaciones de productos
router.get(
  "/relaciones",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.getRelaciones,
);

// DELETE /api/consolidacion/relaciones/:id - Eliminar una relación
router.delete(
  "/relaciones/:id",
  auth,
  requireRole("deposito", "admin"),
  consolidacionController.eliminarRelacion,
);

module.exports = router;
