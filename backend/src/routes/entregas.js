const express = require("express");
const router = express.Router();
const entregasController = require("../controllers/entregasController");
const { auth, authOptional, requireRole } = require("../middleware/auth");

// Ruta pública para verificar código de entrega
router.get(
  "/codigo/:codigo",
  authOptional,
  entregasController.getEntregaPorCodigo,
);

// Rutas protegidas
router.post(
  "/",
  auth,
  requireRole("deposito", "admin"),
  entregasController.crearEntrega,
);
router.post(
  "/codigo/:codigo/confirmar",
  auth,
  requireRole("cliente"),
  entregasController.confirmarEntrega,
);
router.get(
  "/cliente/pendientes",
  auth,
  requireRole("cliente"),
  entregasController.getEntregasPendientesCliente,
);
router.get(
  "/historial",
  auth,
  requireRole("cliente"),
  entregasController.getHistorialEntregas,
);

// Stock del cliente
router.get(
  "/stock",
  auth,
  requireRole("cliente"),
  entregasController.getStockCliente,
);

module.exports = router;
