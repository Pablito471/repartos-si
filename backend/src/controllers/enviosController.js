const {
  Envio,
  Pedido,
  Usuario,
  PedidoProducto,
  StockCliente,
} = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");
const {
  emitirEnvioAsignado,
  emitirEnvioEnCamino,
  emitirEnvioEntregado,
  emitirNotificacion,
  emitirEnvioEntregadoDeposito,
} = require("../services/pusherService");

// GET /api/envios
exports.getEnvios = async (req, res, next) => {
  try {
    const { estado, fechaDesde, fechaHasta } = req.query;

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt[Op.gte] = new Date(fechaDesde);
      if (fechaHasta) where.createdAt[Op.lte] = new Date(fechaHasta);
    }

    // Filtrar según tipo de usuario
    const include = [
      {
        model: Pedido,
        as: "pedido",
        include: [
          {
            model: Usuario,
            as: "cliente",
            attributes: ["id", "nombre", "telefono", "direccion"],
          },
          {
            model: Usuario,
            as: "deposito",
            attributes: ["id", "nombre", "direccion"],
          },
          { model: PedidoProducto, as: "productos" },
        ],
      },
      {
        model: Usuario,
        as: "flete",
        attributes: [
          "id",
          "nombre",
          "telefono",
          "vehiculoTipo",
          "vehiculoPatente",
        ],
      },
    ];

    if (req.usuario.tipoUsuario === "flete") {
      where.fleteId = req.usuario.id;
    } else if (req.usuario.tipoUsuario === "deposito") {
      include[0].where = { depositoId: req.usuario.id };
    }
    // Admin ve todos

    const envios = await Envio.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: envios,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/envios/:id
exports.getEnvio = async (req, res, next) => {
  try {
    const envio = await Envio.findByPk(req.params.id, {
      include: [
        {
          model: Pedido,
          as: "pedido",
          include: [
            {
              model: Usuario,
              as: "cliente",
              attributes: ["id", "nombre", "telefono", "direccion"],
            },
            {
              model: Usuario,
              as: "deposito",
              attributes: ["id", "nombre", "direccion", "telefono"],
            },
            { model: PedidoProducto, as: "productos" },
          ],
        },
        {
          model: Usuario,
          as: "flete",
          attributes: [
            "id",
            "nombre",
            "telefono",
            "vehiculoTipo",
            "vehiculoPatente",
          ],
        },
      ],
    });

    if (!envio) {
      throw new AppError("Envío no encontrado", 404);
    }

    res.json({
      success: true,
      data: envio,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/envios
exports.crearEnvio = async (req, res, next) => {
  try {
    const { pedidoId, fleteId, vehiculo, conductor, notas, fechaEstimada } =
      req.body;

    // Verificar que el pedido existe y está listo
    const pedido = await Pedido.findByPk(pedidoId);
    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    if (pedido.estado !== "listo") {
      throw new AppError(
        "El pedido debe estar en estado 'listo' para crear un envío",
        400,
      );
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      pedido.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Verificar si ya existe un envío para este pedido
    const envioExistente = await Envio.findOne({ where: { pedidoId } });
    if (envioExistente) {
      throw new AppError("Ya existe un envío para este pedido", 400);
    }

    const envio = await Envio.create({
      pedidoId,
      fleteId,
      vehiculo,
      conductor,
      notas,
      fechaSalida: new Date(),
      fechaEstimada: fechaEstimada || new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 horas por defecto
      estado: "en_camino",
    });

    // Actualizar estado del pedido
    await pedido.update({ estado: "enviado" });

    const envioCompleto = await Envio.findByPk(envio.id, {
      include: [
        { model: Pedido, as: "pedido" },
        {
          model: Usuario,
          as: "flete",
          attributes: ["id", "nombre", "telefono"],
        },
      ],
    });

    // Emitir notificaciones
    if (fleteId) {
      emitirEnvioAsignado(fleteId, {
        id: envioCompleto.id,
        pedidoNumero: pedido.numero,
        direccion: pedido.direccion,
      });
    }

    emitirEnvioEnCamino(pedido.clienteId, {
      id: envioCompleto.id,
      numero: pedido.numero,
    });

    res.status(201).json({
      success: true,
      message: "Envío creado",
      data: envioCompleto,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/envios/:id/estado
exports.cambiarEstadoEnvio = async (req, res, next) => {
  try {
    const { estado, notas, ubicacionActual } = req.body;
    const envio = await Envio.findByPk(req.params.id, {
      include: [{ model: Pedido, as: "pedido" }],
    });

    if (!envio) {
      throw new AppError("Envío no encontrado", 404);
    }

    // Verificar permisos (flete asignado, depósito del pedido, o admin)
    if (
      req.usuario.tipoUsuario !== "admin" &&
      envio.fleteId !== req.usuario.id &&
      envio.pedido.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    const updates = { estado };

    if (notas) updates.notas = notas;
    if (ubicacionActual) updates.ubicacionActual = ubicacionActual;

    // Cuando el flete marca como "en_camino", actualizar el pedido a "enviado"
    if (estado === "en_camino") {
      // Actualizar el pedido a enviado si no lo está
      if (
        envio.pedido.estado !== "enviado" &&
        envio.pedido.estado !== "entregado"
      ) {
        await envio.pedido.update({ estado: "enviado" });
      }

      // Emitir notificación al cliente (incluir pedidoId para actualizar estado)
      emitirEnvioEnCamino(envio.pedido.clienteId, {
        id: envio.id,
        pedidoId: envio.pedido.id,
        numero: envio.pedido.numero,
      });

      // Emitir notificación al depósito
      emitirNotificacion(envio.pedido.depositoId, {
        tipo: "info",
        titulo: "Envío en camino",
        mensaje: `El pedido #${envio.pedido.numero || envio.pedido.id} está en camino`,
        datos: { envioId: envio.id, pedidoId: envio.pedido.id },
      });
    }

    if (estado === "entregado") {
      updates.fechaEntrega = new Date();
      // También actualizar el pedido
      await envio.pedido.update({
        estado: "entregado",
        fechaEntrega: new Date(),
      });

      // Agregar productos al stock del cliente automáticamente
      try {
        // Verificar si ya se agregó este pedido al stock
        const yaAgregado = await StockCliente.findOne({
          where: {
            clienteId: envio.pedido.clienteId,
            pedidoId: envio.pedido.id,
          },
        });

        if (!yaAgregado) {
          // Obtener los productos del pedido
          const productos = await PedidoProducto.findAll({
            where: { pedidoId: envio.pedido.id },
          });

          // Agregar cada producto al stock del cliente
          for (const producto of productos) {
            await StockCliente.create({
              clienteId: envio.pedido.clienteId,
              nombre: producto.nombre,
              cantidad: producto.cantidad,
              precio: producto.precioUnitario,
              pedidoId: envio.pedido.id,
            });
          }
          console.log(
            `Stock actualizado para cliente ${envio.pedido.clienteId} - Pedido ${envio.pedido.id}`,
          );
        }
      } catch (stockError) {
        console.error("Error al agregar productos al stock:", stockError);
        // No lanzar error para no interrumpir la entrega
      }

      // Emitir notificación de entrega al cliente (incluir pedidoId para actualizar estado)
      emitirEnvioEntregado(envio.pedido.clienteId, {
        id: envio.id,
        pedidoId: envio.pedido.id,
        numero: envio.pedido.numero,
        stockActualizado: true,
      });

      // Emitir notificación al depósito
      emitirEnvioEntregadoDeposito(envio.pedido.depositoId, {
        id: envio.id,
        pedidoId: envio.pedido.id,
        numero: envio.pedido.numero,
      });
    }

    await envio.update(updates);

    res.json({
      success: true,
      message: `Envío marcado como ${estado}`,
      data: envio,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/envios/:id/ubicacion
exports.actualizarUbicacion = async (req, res, next) => {
  try {
    const { lat, lng, direccion } = req.body;
    const envio = await Envio.findByPk(req.params.id);

    if (!envio) {
      throw new AppError("Envío no encontrado", 404);
    }

    // Solo el flete asignado puede actualizar ubicación
    if (
      envio.fleteId !== req.usuario.id &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    await envio.update({
      ubicacionActual: { lat, lng, direccion, timestamp: new Date() },
    });

    res.json({
      success: true,
      message: "Ubicación actualizada",
      data: envio,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/envios/flete/activos (envíos activos del flete actual)
exports.getEnviosActivosFlete = async (req, res, next) => {
  try {
    if (req.usuario.tipoUsuario !== "flete") {
      throw new AppError("Solo disponible para fletes", 403);
    }

    const envios = await Envio.findAll({
      where: {
        fleteId: req.usuario.id,
        estado: { [Op.in]: ["pendiente", "en_camino"] },
      },
      include: [
        {
          model: Pedido,
          as: "pedido",
          include: [
            {
              model: Usuario,
              as: "cliente",
              attributes: ["id", "nombre", "telefono", "direccion"],
            },
            {
              model: Usuario,
              as: "deposito",
              attributes: ["id", "nombre", "direccion"],
            },
            { model: PedidoProducto, as: "productos" },
          ],
        },
      ],
      order: [["fechaEstimada", "ASC"]],
    });

    res.json({
      success: true,
      data: envios,
    });
  } catch (error) {
    next(error);
  }
};
