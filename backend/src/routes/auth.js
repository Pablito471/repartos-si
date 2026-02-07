const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");

// Rutas públicas
router.post("/registro", authController.registro);
router.post("/login", authController.login);
router.post("/solicitar-recuperacion", authController.solicitarRecuperacion);
router.post("/reset-password", authController.resetPassword);
router.post("/verificar-email", authController.verificarEmail);
router.post("/reenviar-verificacion", authController.reenviarVerificacion);

// Rutas protegidas
router.get("/me", auth, authController.getMe);
router.put("/perfil", auth, authController.actualizarPerfil);
router.put("/cambiar-password", auth, authController.cambiarPassword);

module.exports = router;
