const express = require("express");
const router = express.Router();
const relacionesController = require("../controllers/relacionesController");
const { auth, requireRole } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas para admin
router.get("/", requireRole("admin"), relacionesController.getAllRelaciones);
router.post("/", requireRole("admin"), relacionesController.crearRelacion);
router.delete(
  "/:id",
  requireRole("admin"),
  relacionesController.eliminarRelacion,
);

// Rutas por usuario
router.get("/usuario/:usuarioId", relacionesController.getRelaciones);

// Rutas específicas para clientes
router.get("/cliente/depositos", relacionesController.getDepositosCliente);
router.get(
  "/cliente/:clienteId/depositos",
  relacionesController.getDepositosCliente,
);

// Rutas específicas para depósitos
router.get("/deposito/clientes", relacionesController.getClientesDeposito);
router.get(
  "/deposito/:depositoId/clientes",
  relacionesController.getClientesDeposito,
);
router.get("/deposito/fletes", relacionesController.getFletesDeposito);
router.get(
  "/deposito/:depositoId/fletes",
  relacionesController.getFletesDeposito,
);

// Rutas específicas para fletes
router.get("/flete/depositos", relacionesController.getDepositosFlete);
router.get("/flete/:fleteId/depositos", relacionesController.getDepositosFlete);

module.exports = router;
