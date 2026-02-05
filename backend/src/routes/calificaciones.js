const express = require("express");
const router = express.Router();
const calificacionesController = require("../controllers/calificacionesController");
const { auth, authOptional, requireRole } = require("../middleware/auth");

// Rutas públicas
router.get("/usuario/:id", calificacionesController.getCalificacionesUsuario);
router.get("/promedio/:usuarioId", calificacionesController.getPromedioUsuario);

// Rutas protegidas
router.get(
  "/estadisticas",
  auth,
  requireRole("admin"),
  calificacionesController.getEstadisticas,
);
router.get(
  "/pendientes",
  auth,
  calificacionesController.getPendientesCalificar,
);
router.get("/", authOptional, calificacionesController.getCalificaciones);
router.post("/", auth, calificacionesController.crearCalificacion);

module.exports = router;
