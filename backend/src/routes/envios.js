const express = require("express");
const router = express.Router();
const enviosController = require("../controllers/enviosController");
const { auth, requireRole } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

router.get("/", enviosController.getEnvios);
router.get(
  "/flete/activos",
  requireRole("flete"),
  enviosController.getEnviosActivosFlete,
);
router.get("/:id", enviosController.getEnvio);
router.post("/", requireRole("deposito", "admin"), enviosController.crearEnvio);
router.put("/:id/estado", enviosController.cambiarEstadoEnvio);
router.put(
  "/:id/ubicacion",
  requireRole("flete"),
  enviosController.actualizarUbicacion,
);

module.exports = router;
