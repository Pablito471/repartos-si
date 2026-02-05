const { Mensaje, Conversacion, Usuario } = require("../models");
const { Op } = require("sequelize");
const { emitirNuevoMensaje } = require("../services/pusherService");

// Obtener o crear conversación con admin
exports.getOCrearConversacion = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Buscar un admin activo
    const admin = await Usuario.findOne({
      where: { tipoUsuario: "admin", activo: true },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        mensaje: "No hay administradores disponibles",
      });
    }

    // Buscar conversación existente
    let conversacion = await Conversacion.findOne({
      where: {
        usuarioId,
        adminId: admin.id,
      },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "email", "foto", "tipoUsuario"],
        },
        {
          model: Usuario,
          as: "admin",
          attributes: ["id", "nombre", "email", "foto", "tipoUsuario"],
        },
      ],
    });

    // Si no existe, crear una nueva
    if (!conversacion) {
      conversacion = await Conversacion.create({
        usuarioId,
        adminId: admin.id,
        estado: "activa",
      });

      conversacion = await Conversacion.findByPk(conversacion.id, {
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email", "foto", "tipoUsuario"],
          },
          {
            model: Usuario,
            as: "admin",
            attributes: ["id", "nombre", "email", "foto", "tipoUsuario"],
          },
        ],
      });
    }

    res.json({
      success: true,
      data: conversacion,
    });
  } catch (error) {
    console.error("Error al obtener/crear conversación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener conversación",
    });
  }
};

// Obtener todas las conversaciones (para admin)
exports.getConversaciones = async (req, res) => {
  try {
    const adminId = req.usuario.id;

    const conversaciones = await Conversacion.findAll({
      where: {
        adminId,
        estado: { [Op.ne]: "archivada" },
      },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "email", "foto", "tipoUsuario"],
        },
      ],
      order: [["ultimoMensajeFecha", "DESC"]],
    });

    res.json({
      success: true,
      data: conversaciones,
    });
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener conversaciones",
    });
  }
};

// Obtener mensajes de una conversación
exports.getMensajes = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que el usuario tiene acceso a esta conversación
    const conversacion = await Conversacion.findByPk(conversacionId);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        mensaje: "Conversación no encontrada",
      });
    }

    if (
      conversacion.usuarioId !== req.usuario.id &&
      conversacion.adminId !== req.usuario.id
    ) {
      return res.status(403).json({
        success: false,
        mensaje: "No tienes acceso a esta conversación",
      });
    }

    const mensajes = await Mensaje.findAll({
      where: { conversacionId },
      include: [
        {
          model: Usuario,
          as: "remitente",
          attributes: ["id", "nombre", "foto", "tipoUsuario"],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Marcar como leídos los mensajes que no son del usuario actual
    await Mensaje.update(
      { leido: true, fechaLeido: new Date() },
      {
        where: {
          conversacionId,
          destinatarioId: req.usuario.id,
          leido: false,
        },
      },
    );

    // Resetear contador de no leídos
    const esAdmin = req.usuario.tipoUsuario === "admin";
    if (esAdmin) {
      await conversacion.update({ mensajesNoLeidosAdmin: 0 });
    } else {
      await conversacion.update({ mensajesNoLeidos: 0 });
    }

    res.json({
      success: true,
      data: mensajes,
    });
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener mensajes",
    });
  }
};

// Enviar mensaje
exports.enviarMensaje = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const { contenido, tipo = "texto" } = req.body;
    const remitenteId = req.usuario.id;

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({
        success: false,
        mensaje: "El mensaje no puede estar vacío",
      });
    }

    // Verificar que el usuario tiene acceso a esta conversación
    const conversacion = await Conversacion.findByPk(conversacionId);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        mensaje: "Conversación no encontrada",
      });
    }

    if (
      conversacion.usuarioId !== remitenteId &&
      conversacion.adminId !== remitenteId
    ) {
      return res.status(403).json({
        success: false,
        mensaje: "No tienes acceso a esta conversación",
      });
    }

    // Determinar destinatario
    const destinatarioId =
      remitenteId === conversacion.usuarioId
        ? conversacion.adminId
        : conversacion.usuarioId;

    // Crear mensaje
    const mensaje = await Mensaje.create({
      conversacionId,
      remitenteId,
      destinatarioId,
      contenido: contenido.trim(),
      tipo,
    });

    // Actualizar conversación
    const esAdmin = req.usuario.tipoUsuario === "admin";
    await conversacion.update({
      ultimoMensaje: contenido.substring(0, 100),
      ultimoMensajeFecha: new Date(),
      ...(esAdmin
        ? { mensajesNoLeidos: conversacion.mensajesNoLeidos + 1 }
        : { mensajesNoLeidosAdmin: conversacion.mensajesNoLeidosAdmin + 1 }),
    });

    // Obtener mensaje con datos del remitente
    const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
      include: [
        {
          model: Usuario,
          as: "remitente",
          attributes: ["id", "nombre", "foto", "tipoUsuario"],
        },
      ],
    });

    // Emitir mensaje en tiempo real vía Pusher
    emitirNuevoMensaje(
      conversacionId,
      mensajeCompleto,
      remitenteId,
      destinatarioId,
    );

    res.status(201).json({
      success: true,
      data: mensajeCompleto,
    });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al enviar mensaje",
    });
  }
};

// Marcar mensajes como leídos
exports.marcarLeidos = async (req, res) => {
  try {
    const { conversacionId } = req.params;

    await Mensaje.update(
      { leido: true, fechaLeido: new Date() },
      {
        where: {
          conversacionId,
          destinatarioId: req.usuario.id,
          leido: false,
        },
      },
    );

    // Resetear contador
    const conversacion = await Conversacion.findByPk(conversacionId);
    const esAdmin = req.usuario.tipoUsuario === "admin";
    if (esAdmin) {
      await conversacion.update({ mensajesNoLeidosAdmin: 0 });
    } else {
      await conversacion.update({ mensajesNoLeidos: 0 });
    }

    res.json({
      success: true,
      mensaje: "Mensajes marcados como leídos",
    });
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al marcar mensajes",
    });
  }
};

// Obtener cantidad de mensajes no leídos
exports.getNoLeidos = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const esAdmin = req.usuario.tipoUsuario === "admin";

    let totalNoLeidos;

    if (esAdmin) {
      const conversaciones = await Conversacion.findAll({
        where: { adminId: userId },
      });
      totalNoLeidos = conversaciones.reduce(
        (sum, c) => sum + c.mensajesNoLeidosAdmin,
        0,
      );
    } else {
      const conversacion = await Conversacion.findOne({
        where: { usuarioId: userId },
      });
      totalNoLeidos = conversacion ? conversacion.mensajesNoLeidos : 0;
    }

    res.json({
      success: true,
      data: { totalNoLeidos },
    });
  } catch (error) {
    console.error("Error al obtener mensajes no leídos:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener mensajes no leídos",
    });
  }
};

// Cerrar conversación (admin)
exports.cerrarConversacion = async (req, res) => {
  try {
    const { conversacionId } = req.params;

    const conversacion = await Conversacion.findByPk(conversacionId);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        mensaje: "Conversación no encontrada",
      });
    }

    await conversacion.update({ estado: "cerrada" });

    res.json({
      success: true,
      mensaje: "Conversación cerrada",
    });
  } catch (error) {
    console.error("Error al cerrar conversación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al cerrar conversación",
    });
  }
};
