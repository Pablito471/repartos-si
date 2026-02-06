const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Usuario, Mensaje, Conversacion } = require("./models");

let io;

// Mapa para rastrear usuarios conectados (global para acceso desde otros módulos)
const usuariosConectados = new Map();

// Función para verificar si un usuario está conectado
const isUserConnected = (userId) => {
  return usuariosConectados.has(userId);
};

// Función para emitir evento a un usuario específico
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

// Función para emitir a una conversación
const emitToConversation = (conversacionId, event, data) => {
  if (io) {
    io.to(`conversacion_${conversacionId}`).emit(event, data);
  }
};

const initSocket = (server) => {
  // Configurar orígenes permitidos
  const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findByPk(decoded.id, {
        attributes: ["id", "nombre", "email", "tipoUsuario", "foto"],
      });

      if (!usuario) {
        return next(new Error("Usuario no encontrado"));
      }

      socket.user = usuario;
      next();
    } catch (error) {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Usuario conectado: ${socket.user.nombre} (${socket.user.id}) - Tipo: ${socket.user.tipoUsuario}`,
    );

    // Registrar usuario conectado
    usuariosConectados.set(socket.user.id, socket.id);

    // Unirse a sala personal
    socket.join(`user_${socket.user.id}`);

    // Marcar todos los mensajes pendientes como entregados cuando el usuario se conecta
    (async () => {
      try {
        // Buscar mensajes no entregados para este usuario
        const mensajesPendientes = await Mensaje.findAll({
          where: {
            destinatarioId: socket.user.id,
            entregado: false,
          },
          attributes: ["id", "conversacionId", "remitenteId"],
        });

        if (mensajesPendientes.length > 0) {
          // Marcar como entregados
          await Mensaje.update(
            { entregado: true, fechaEntregado: new Date() },
            {
              where: {
                destinatarioId: socket.user.id,
                entregado: false,
              },
            },
          );

          // Agrupar por conversación y remitente para notificar
          const conversaciones = [
            ...new Set(mensajesPendientes.map((m) => m.conversacionId)),
          ];
          const remitentes = [
            ...new Set(mensajesPendientes.map((m) => m.remitenteId)),
          ];

          // Notificar a cada remitente
          remitentes.forEach((remitenteId) => {
            const mensajesDeRemitente = mensajesPendientes.filter(
              (m) => m.remitenteId === remitenteId,
            );
            mensajesDeRemitente.forEach((msg) => {
              io.to(`user_${remitenteId}`).emit("mensaje_entregado", {
                mensajeId: msg.id,
                conversacionId: msg.conversacionId,
              });
            });
          });

          console.log(
            `Marcados ${mensajesPendientes.length} mensajes como entregados para ${socket.user.nombre}`,
          );
        }
      } catch (error) {
        // Silenciar errores si las columnas no existen aún
        if (!error.message?.includes("column")) {
          console.error(
            "Error al marcar mensajes pendientes como entregados:",
            error,
          );
        }
      }
    })();

    // Unirse a salas según tipo de usuario
    if (socket.user.tipoUsuario === "admin") {
      socket.join("admins");
      console.log(`${socket.user.nombre} se unió a sala admins`);
    } else if (socket.user.tipoUsuario === "deposito") {
      socket.join("depositos");
      console.log(`${socket.user.nombre} se unió a sala depositos`);
    } else if (socket.user.tipoUsuario === "flete") {
      socket.join("fletes");
      console.log(`${socket.user.nombre} se unió a sala fletes`);
    } else if (socket.user.tipoUsuario === "cliente") {
      socket.join("clientes");
      console.log(`${socket.user.nombre} se unió a sala clientes`);
    }

    // Emitir estado de conexión
    io.emit("usuario_conectado", {
      userId: socket.user.id,
      nombre: socket.user.nombre,
      tipoUsuario: socket.user.tipoUsuario,
    });

    // Unirse a una conversación
    socket.on("join_conversacion", (conversacionId) => {
      socket.join(`conversacion_${conversacionId}`);
      console.log(
        `${socket.user.nombre} se unió a conversación ${conversacionId}`,
      );
    });

    // Salir de una conversación
    socket.on("leave_conversacion", (conversacionId) => {
      socket.leave(`conversacion_${conversacionId}`);
    });

    // Enviar mensaje
    socket.on("enviar_mensaje", async (data) => {
      try {
        const { conversacionId, contenido, tipo = "texto" } = data;

        // Verificar conversación
        const conversacion = await Conversacion.findByPk(conversacionId);
        if (!conversacion) return;

        // Determinar destinatario
        const destinatarioId =
          socket.user.id === conversacion.usuarioId
            ? conversacion.adminId
            : conversacion.usuarioId;

        // Verificar si el destinatario está conectado ANTES de crear el mensaje
        const destinatarioConectado = usuariosConectados.has(destinatarioId);
        console.log(
          `Destinatario ${destinatarioId} conectado: ${destinatarioConectado}`,
        );
        console.log(
          `Usuarios conectados:`,
          Array.from(usuariosConectados.keys()),
        );

        // Crear mensaje en DB con estado de entregado si el destinatario está conectado
        const mensaje = await Mensaje.create({
          conversacionId,
          remitenteId: socket.user.id,
          destinatarioId,
          contenido: contenido.trim(),
          tipo,
          entregado: destinatarioConectado,
          fechaEntregado: destinatarioConectado ? new Date() : null,
        });

        // Actualizar conversación
        const esAdmin = socket.user.tipoUsuario === "admin";
        await conversacion.update({
          ultimoMensaje: contenido.substring(0, 100),
          ultimoMensajeFecha: new Date(),
          ...(esAdmin
            ? { mensajesNoLeidos: conversacion.mensajesNoLeidos + 1 }
            : {
                mensajesNoLeidosAdmin: conversacion.mensajesNoLeidosAdmin + 1,
              }),
        });

        // Obtener mensaje completo con todos los campos de estado
        const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
          include: [
            {
              model: Usuario,
              as: "remitente",
              attributes: ["id", "nombre", "foto", "tipoUsuario"],
            },
          ],
        });

        // Asegurar que los campos de estado estén presentes en el objeto
        const mensajeConEstado = {
          ...mensajeCompleto.toJSON(),
          entregado: mensajeCompleto.entregado,
          leido: mensajeCompleto.leido,
        };

        console.log(
          `Mensaje enviado - entregado: ${mensajeConEstado.entregado}, leido: ${mensajeConEstado.leido}`,
        );

        // Emitir a la sala de la conversación
        io.to(`conversacion_${conversacionId}`).emit(
          "nuevo_mensaje",
          mensajeConEstado,
        );

        // También emitir al remitente y destinatario directamente para asegurar entrega
        io.to(`user_${socket.user.id}`).emit("nuevo_mensaje", mensajeConEstado);
        io.to(`user_${destinatarioId}`).emit("nuevo_mensaje", mensajeConEstado);

        // Notificar al destinatario específicamente
        io.to(`user_${destinatarioId}`).emit("notificacion_mensaje", {
          conversacionId,
          mensaje: mensajeConEstado,
          remitente: socket.user,
        });
      } catch (error) {
        console.error("Error al enviar mensaje via socket:", error);
        socket.emit("error_mensaje", { error: "Error al enviar mensaje" });
      }
    });

    // Escribiendo...
    socket.on("escribiendo", (data) => {
      socket
        .to(`conversacion_${data.conversacionId}`)
        .emit("usuario_escribiendo", {
          usuarioId: socket.user.id,
          nombre: socket.user.nombre,
          conversacionId: data.conversacionId,
        });
    });

    // Dejó de escribir
    socket.on("dejo_escribir", (data) => {
      socket
        .to(`conversacion_${data.conversacionId}`)
        .emit("usuario_dejo_escribir", {
          usuarioId: socket.user.id,
          conversacionId: data.conversacionId,
        });
    });

    // Marcar mensajes como entregados (cuando el usuario se conecta o recibe mensaje)
    socket.on("marcar_entregados", async (conversacionId) => {
      try {
        const mensajesActualizados = await Mensaje.update(
          { entregado: true, fechaEntregado: new Date() },
          {
            where: {
              conversacionId,
              destinatarioId: socket.user.id,
              entregado: false,
            },
          },
        );

        if (mensajesActualizados[0] > 0) {
          // Notificar a los remitentes que sus mensajes fueron entregados
          socket
            .to(`conversacion_${conversacionId}`)
            .emit("mensajes_entregados", {
              conversacionId,
              destinatarioId: socket.user.id,
            });
        }
      } catch (error) {
        // Silenciar error si las columnas no existen aún
        if (!error.message?.includes("column")) {
          console.error("Error al marcar mensajes entregados:", error);
        }
      }
    });

    // Marcar mensajes como leídos
    socket.on("marcar_leidos", async (conversacionId) => {
      try {
        // Intentar marcar como entregados y leídos
        try {
          await Mensaje.update(
            {
              entregado: true,
              fechaEntregado: new Date(),
              leido: true,
              fechaLeido: new Date(),
            },
            {
              where: {
                conversacionId,
                destinatarioId: socket.user.id,
                leido: false,
              },
            },
          );
        } catch (updateError) {
          // Si falla por columnas no existentes, solo marcar como leídos
          await Mensaje.update(
            {
              leido: true,
              fechaLeido: new Date(),
            },
            {
              where: {
                conversacionId,
                destinatarioId: socket.user.id,
                leido: false,
              },
            },
          );
        }

        const conversacion = await Conversacion.findByPk(conversacionId);
        if (conversacion) {
          const esAdmin = socket.user.tipoUsuario === "admin";
          if (esAdmin) {
            await conversacion.update({ mensajesNoLeidosAdmin: 0 });
          } else {
            await conversacion.update({ mensajesNoLeidos: 0 });
          }
        }

        socket.to(`conversacion_${conversacionId}`).emit("mensajes_leidos", {
          conversacionId,
          lectorId: socket.user.id,
        });
      } catch (error) {
        console.error("Error al marcar mensajes leídos:", error);
      }
    });

    // ========== VIDEOLLAMADAS ==========

    // Solicitar videollamada
    socket.on("videollamada_solicitar", (data) => {
      console.log(
        `Videollamada solicitada: ${socket.user.nombre} -> Usuario ${data.usuarioDestinoId}`,
      );

      // Enviar notificación al destinatario
      io.to(`user_${data.usuarioDestinoId}`).emit("videollamada_entrante", {
        conversacionId: data.conversacionId,
        usuarioId: socket.user.id,
        nombreLlamante: socket.user.nombre,
        offer: data.offer,
      });
    });

    // Aceptar videollamada
    socket.on("videollamada_aceptar", (data) => {
      console.log(
        `Videollamada aceptada por ${socket.user.nombre} -> Usuario ${data.usuarioDestinoId}`,
      );

      io.to(`user_${data.usuarioDestinoId}`).emit("videollamada_aceptada", {
        conversacionId: data.conversacionId,
        usuarioId: socket.user.id,
        answer: data.answer,
      });
    });

    // Rechazar videollamada
    socket.on("videollamada_rechazar", (data) => {
      console.log(
        `Videollamada rechazada por ${socket.user.nombre} -> Usuario ${data.usuarioDestinoId}`,
      );

      io.to(`user_${data.usuarioDestinoId}`).emit("videollamada_rechazada", {
        conversacionId: data.conversacionId,
        usuarioId: socket.user.id,
      });
    });

    // Terminar videollamada
    socket.on("videollamada_terminar", (data) => {
      console.log(
        `Videollamada terminada por ${socket.user.nombre} -> Usuario ${data.usuarioDestinoId}`,
      );

      io.to(`user_${data.usuarioDestinoId}`).emit("videollamada_terminada", {
        conversacionId: data.conversacionId,
        usuarioId: socket.user.id,
      });
    });

    // ICE Candidate para WebRTC
    socket.on("webrtc_ice_candidate", (data) => {
      io.to(`user_${data.usuarioDestinoId}`).emit("webrtc_ice_candidate", {
        candidate: data.candidate,
        usuarioId: socket.user.id,
      });
    });

    // Desconexión
    socket.on("disconnect", () => {
      console.log(`Usuario desconectado: ${socket.user.nombre}`);
      usuariosConectados.delete(socket.user.id);
      io.emit("usuario_desconectado", {
        userId: socket.user.id,
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado");
  }
  return io;
};

// Funciones para emitir notificaciones desde otros módulos
const emitirNotificacion = (usuarioId, notificacion) => {
  if (io) {
    io.to(`user_${usuarioId}`).emit("notificacion", notificacion);
  }
};

const emitirNuevoPedido = (depositoId, pedido) => {
  if (io) {
    console.log(`Emitiendo nuevo_pedido a user_${depositoId}:`, pedido);
    // Emitir al depósito específico
    io.to(`user_${depositoId}`).emit("nuevo_pedido", pedido);
    // También a los admins
    io.to("admins").emit("nuevo_pedido", pedido);
  } else {
    console.warn("Socket.io no inicializado, no se puede emitir nuevo_pedido");
  }
};

const emitirPedidoActualizado = (clienteId, pedido) => {
  if (io) {
    console.log(`Emitiendo pedido_actualizado a user_${clienteId}:`, pedido);
    io.to(`user_${clienteId}`).emit("pedido_actualizado", pedido);
  } else {
    console.warn(
      "Socket.io no inicializado, no se puede emitir pedido_actualizado",
    );
  }
};

const emitirEnvioAsignado = (fleteId, envio) => {
  if (io) {
    console.log(`Emitiendo envio_asignado a user_${fleteId}:`, envio);
    io.to(`user_${fleteId}`).emit("envio_asignado", envio);
  } else {
    console.warn(
      "Socket.io no inicializado, no se puede emitir envio_asignado",
    );
  }
};

const emitirEnvioEnCamino = (clienteId, envio) => {
  if (io) {
    console.log(`Emitiendo envio_en_camino a user_${clienteId}:`, envio);
    io.to(`user_${clienteId}`).emit("envio_en_camino", envio);
  } else {
    console.warn(
      "Socket.io no inicializado, no se puede emitir envio_en_camino",
    );
  }
};

const emitirEnvioEntregado = (clienteId, envio) => {
  if (io) {
    console.log(`Emitiendo envio_entregado a user_${clienteId}:`, envio);
    io.to(`user_${clienteId}`).emit("envio_entregado", envio);
  } else {
    console.warn(
      "Socket.io no inicializado, no se puede emitir envio_entregado",
    );
  }
};

const emitirCuentaEstado = (usuarioId, activo, mensaje) => {
  if (io) {
    io.to(`user_${usuarioId}`).emit("cuenta_estado", { activo, mensaje });
  }
};

const emitirStockBajo = (depositoId, producto, cantidad) => {
  if (io) {
    io.to(`user_${depositoId}`).emit("stock_bajo", { producto, cantidad });
  }
};

// Emitir nuevo mensaje de chat
const emitirNuevoMensaje = (
  conversacionId,
  mensaje,
  remitenteId,
  destinatarioId,
) => {
  if (io) {
    // Emitir a la sala de la conversación
    io.to(`conversacion_${conversacionId}`).emit("nuevo_mensaje", mensaje);

    // Emitir directamente a ambos usuarios para asegurar entrega
    io.to(`user_${remitenteId}`).emit("nuevo_mensaje", mensaje);
    io.to(`user_${destinatarioId}`).emit("nuevo_mensaje", mensaje);

    // Notificar al destinatario
    io.to(`user_${destinatarioId}`).emit("notificacion_mensaje", {
      conversacionId,
      mensaje,
    });
  } else {
    console.warn("Socket.io no inicializado, no se puede emitir nuevo_mensaje");
  }
};

module.exports = {
  initSocket,
  getIO,
  isUserConnected,
  emitToUser,
  emitToConversation,
  emitirNotificacion,
  emitirNuevoPedido,
  emitirPedidoActualizado,
  emitirEnvioAsignado,
  emitirEnvioEnCamino,
  emitirEnvioEntregado,
  emitirCuentaEstado,
  emitirStockBajo,
  emitirNuevoMensaje,
};
