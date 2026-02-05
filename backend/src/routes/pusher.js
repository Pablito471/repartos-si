// Ruta de autenticación para Pusher (canales privados)
const express = require("express");
const router = express.Router();
const { getPusher, isPusherEnabled } = require("../services/pusherService");
const { verificarToken } = require("../middleware/auth");

// POST /api/pusher/auth - Autenticar canal privado de Pusher
router.post("/auth", verificarToken, (req, res) => {
  // Si Pusher no está habilitado, retornar error amigable
  if (!isPusherEnabled()) {
    return res.status(503).json({ 
      error: "Pusher no configurado", 
      message: "Notificaciones en tiempo real no disponibles" 
    });
  }

  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const usuario = req.usuario;

  // Validar que el canal corresponda al usuario
  if (channel.startsWith("private-user-")) {
    const userIdFromChannel = channel.replace("private-user-", "");
    if (userIdFromChannel !== usuario.id) {
      return res.status(403).json({ error: "No autorizado para este canal" });
    }
  }

  // Validar canal de rol
  if (channel.startsWith("private-role-")) {
    const roleFromChannel = channel.replace("private-role-", "");
    if (roleFromChannel !== usuario.tipoUsuario) {
      return res
        .status(403)
        .json({ error: "No autorizado para este canal de rol" });
    }
  }

  // Para canales de conversación, verificar pertenencia (simplificado)
  // En producción deberías verificar que el usuario pertenece a la conversación
  if (channel.startsWith("private-conversation-")) {
    // Por ahora permitir si está autenticado
    // TODO: Verificar que el usuario pertenece a la conversación
  }

  try {
    const pusher = getPusher();
    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: usuario.id,
      user_info: {
        nombre: usuario.nombre,
        tipoUsuario: usuario.tipoUsuario,
      },
    });
    res.send(authResponse);
  } catch (error) {
    console.error("Error autenticando canal Pusher:", error);
    res.status(500).json({ error: "Error de autenticación" });
  }
});

module.exports = router;
