const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Usuario, Mensaje, Conversacion } = require("./models");

let io;

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

  // Mapa para rastrear usuarios conectados
  const usuariosConectados = new Map();

  io.on("connection", (socket) => {
    console.log(
      `Usuario conectado: ${socket.user.nombre} (${socket.user.id}) - Tipo: ${socket.user.tipoUsuario}`,
    );

    // Registrar usuario conectado
    usuariosConectados.set(socket.user.id, socket.id);

    // Unirse a sala personal
    socket.join(`user_${socket.user.id}`);

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
    socket.on("unirse_conversacion", (conversacionId) => {
      socket.join(`conversacion_${conversacionId}`);
      console.log(
        `${socket.user.nombre} se unió a conversación ${conversacionId}`,
      );
    });

    // Salir de una conversación
    socket.on("salir_conversacion", (conversacionId) => {
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

        // Crear mensaje en DB
        const mensaje = await Mensaje.create({
          conversacionId,
          remitenteId: socket.user.id,
          destinatarioId,
          contenido: contenido.trim(),
          tipo,
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

        // Obtener mensaje completo
        const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
          include: [
            {
              model: Usuario,
              as: "remitente",
              attributes: ["id", "nombre", "foto", "tipoUsuario"],
            },
          ],
        });

        // Emitir a la sala de la conversación
        io.to(`conversacion_${conversacionId}`).emit(
          "nuevo_mensaje",
          mensajeCompleto,
        );

        // También emitir al remitente y destinatario directamente para asegurar entrega
        io.to(`user_${socket.user.id}`).emit("nuevo_mensaje", mensajeCompleto);
        io.to(`user_${destinatarioId}`).emit("nuevo_mensaje", mensajeCompleto);

        // Notificar al destinatario específicamente
        io.to(`user_${destinatarioId}`).emit("notificacion_mensaje", {
          conversacionId,
          mensaje: mensajeCompleto,
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

    // Marcar mensajes como leídos
    socket.on("marcar_leidos", async (conversacionId) => {
      try {
        await Mensaje.update(
          { leido: true, fechaLeido: new Date() },
          {
            where: {
              conversacionId,
              destinatarioId: socket.user.id,
              leido: false,
            },
          },
        );

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

module.exports = {
  initSocket,
  getIO,
  emitirNotificacion,
  emitirNuevoPedido,
  emitirPedidoActualizado,
  emitirEnvioAsignado,
  emitirEnvioEnCamino,
  emitirEnvioEntregado,
  emitirCuentaEstado,
  emitirStockBajo,
};
