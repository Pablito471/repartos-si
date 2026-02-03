const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");
const { auth, requireRole } = require("../middleware/auth");

// Rutas públicas
router.get("/depositos", usuariosController.getDepositos);
router.get("/fletes", usuariosController.getFletes);

// Rutas protegidas
router.get("/", auth, requireRole("admin"), usuariosController.getUsuarios);
router.get("/:id", auth, usuariosController.getUsuario);
router.put("/:id", auth, usuariosController.actualizarUsuario);
router.put(
  "/:id/activar",
  auth,
  requireRole("admin"),
  usuariosController.activarUsuario,
);
router.put(
  "/:id/desactivar",
  auth,
  requireRole("admin"),
  usuariosController.desactivarUsuario,
);

// Eliminar usuario permanentemente
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  usuariosController.eliminarUsuario,
);

module.exports = router;
