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
router.delete(
  "/:id",
  auth,
  requireRole("deposito", "admin"),
  productosController.eliminarProducto,
);

module.exports = router;
