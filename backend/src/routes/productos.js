const express = require("express");
const router = express.Router();
const productosController = require("../controllers/productosController");
const { auth, authOptional, requireRole } = require("../middleware/auth");

// Rutas públicas (con auth opcional para filtrar por depósito propio)
router.get("/", authOptional, productosController.getProductos);
router.get(
  "/deposito/:depositoId",
  productosController.getProductosPorDeposito,
);

// Ruta para productos inactivos (debe ir antes de /:id)
router.get(
  "/inactivos",
  auth,
  requireRole("deposito", "admin"),
  productosController.getProductosInactivos,
);

// Ruta para buscar por código de barras (debe ir antes de /:id)
router.get(
  "/buscar-codigo/:codigo",
  auth,
  requireRole("deposito", "admin"),
  productosController.buscarPorCodigo,
);

router.get("/:id", productosController.getProducto);

// Rutas protegidas (solo depósitos y admin)
router.post(
  "/",
  auth,
  requireRole("deposito", "admin"),
  productosController.crearProducto,
);
router.put(
  "/:id",
  auth,
  requireRole("deposito", "admin"),
  productosController.actualizarProducto,
);
router.put(
  "/:id/stock",
  auth,
  requireRole("deposito", "admin"),
  productosController.actualizarStock,
);

// Reactivar producto (deshacer borrado lógico)
router.put(
  "/:id/reactivar",
  auth,
  requireRole("deposito", "admin"),
  productosController.reactivarProducto,
);

// Registrar movimiento de stock (entrada/salida)
router.put(
  "/:id/movimiento-stock",
  auth,
  requireRole("deposito", "admin"),
  productosController.registrarMovimientoStock,
);

// Borrado lógico (soft delete)
router.delete(
  "/:id",
  auth,
  requireRole("deposito", "admin"),
  productosController.eliminarProducto,
);

// Borrado permanente (hard delete)
router.delete(
  "/:id/permanente",
  auth,
  requireRole("deposito", "admin"),
  productosController.eliminarPermanente,
);

// Rutas para códigos alternativos
router.post(
  "/:id/codigos-alternativos",
  auth,
  requireRole("deposito", "admin"),
  productosController.agregarCodigoAlternativo,
);
router.get(
  "/:id/codigos-alternativos",
  auth,
  requireRole("deposito", "admin"),
  productosController.getCodigosAlternativos,
);
router.delete(
  "/:id/codigos-alternativos/:codigoId",
  auth,
  requireRole("deposito", "admin"),
  productosController.eliminarCodigoAlternativo,
);

module.exports = router;

