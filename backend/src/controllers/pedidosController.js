const {
  Pedido,
  PedidoProducto,
  Usuario,
  Producto,
  Envio,
  sequelize,
} = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");
const { emitirNuevoPedido, emitirPedidoActualizado } = require("../socket");

// GET /api/pedidos
exports.getPedidos = async (req, res, next) => {
  try {
    const { estado, tipoEnvio, prioridad, fechaDesde, fechaHasta } = req.query;

    const where = {};

    // Filtrar según el tipo de usuario
    if (req.usuario.tipoUsuario === "cliente") {
      where.clienteId = req.usuario.id;
    } else if (req.usuario.tipoUsuario === "deposito") {
      where.depositoId = req.usuario.id;
    }
    // Admin ve todos

    if (estado) {
      where.estado = estado;
    }

    if (tipoEnvio) {
      where.tipoEnvio = tipoEnvio;
    }

    if (prioridad) {
      where.prioridad = prioridad;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt[Op.gte] = new Date(fechaDesde);
      if (fechaHasta) where.createdAt[Op.lte] = new Date(fechaHasta);
    }

    const pedidos = await Pedido.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: "cliente",
          attributes: ["id", "nombre", "email", "telefono", "direccion"],
        },
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre", "direccion"],
        },
        {
          model: PedidoProducto,
          as: "productos",
        },
        {
          model: Envio,
          as: "envio",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: pedidos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/pedidos/:id
exports.getPedido = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "cliente",
          attributes: ["id", "nombre", "email", "telefono", "direccion"],
        },
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre", "direccion", "telefono"],
        },
        {
          model: PedidoProducto,
          as: "productos",
        },
        {
          model: Envio,
          as: "envio",
          include: [
            {
              model: Usuario,
              as: "flete",
              attributes: ["id", "nombre", "telefono"],
            },
          ],
        },
      ],
    });

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      pedido.clienteId !== req.usuario.id &&
      pedido.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    res.json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/pedidos
exports.crearPedido = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { depositoId, tipoEnvio, direccion, productos, notas } = req.body;

    if (!productos || productos.length === 0) {
      throw new AppError("El pedido debe tener al menos un producto", 400);
    }

    // Calcular total
    let total = 0;
    for (const prod of productos) {
      total += prod.cantidad * prod.precio;
    }

    // Crear pedido
    const pedido = await Pedido.create(
      {
        clienteId: req.usuario.id,
        depositoId,
        tipoEnvio,
        direccion: tipoEnvio === "retiro" ? "Retiro en depósito" : direccion,
        total,
        notas,
      },
      { transaction: t },
    );

    // Crear productos del pedido
    for (const prod of productos) {
      await PedidoProducto.create(
        {
          pedidoId: pedido.id,
          productoId: prod.productoId || null,
          nombre: prod.nombre,
          cantidad: prod.cantidad,
          precioUnitario: prod.precio,
          subtotal: prod.cantidad * prod.precio,
        },
        { transaction: t },
      );

      // Descontar stock si hay productoId
      if (prod.productoId) {
        await Producto.decrement("stock", {
          by: prod.cantidad,
          where: { id: prod.productoId },
          transaction: t,
        });
      }
    }

    await t.commit();

    // Obtener pedido completo
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        { model: Usuario, as: "cliente", attributes: ["id", "nombre"] },
        { model: Usuario, as: "deposito", attributes: ["id", "nombre"] },
        { model: PedidoProducto, as: "productos" },
      ],
    });

    // Emitir notificación al depósito
    emitirNuevoPedido(depositoId, {
      id: pedidoCompleto.id,
      numero: pedidoCompleto.numero,
      cliente: pedidoCompleto.cliente?.nombre,
      total: pedidoCompleto.total,
    });

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      data: pedidoCompleto,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/pedidos/:id
exports.actualizarPedido = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Solo el cliente puede modificar y solo si está pendiente
    if (
      pedido.clienteId !== req.usuario.id &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    if (pedido.estado !== "pendiente") {
      throw new AppError("Solo se pueden modificar pedidos pendientes", 400);
    }

    const { tipoEnvio, direccion, productos, notas } = req.body;

    // Si hay nuevos productos, actualizar
    if (productos && productos.length > 0) {
      // Eliminar productos anteriores
      await PedidoProducto.destroy({
        where: { pedidoId: pedido.id },
        transaction: t,
      });

      // Calcular nuevo total y crear productos
      let total = 0;
      for (const prod of productos) {
        total += prod.cantidad * prod.precio;
        await PedidoProducto.create(
          {
            pedidoId: pedido.id,
            productoId: prod.productoId || null,
            nombre: prod.nombre,
            cantidad: prod.cantidad,
            precioUnitario: prod.precio,
            subtotal: prod.cantidad * prod.precio,
          },
          { transaction: t },
        );
      }

      await pedido.update({ total }, { transaction: t });
    }

    // Actualizar otros campos
    await pedido.update(
      {
        tipoEnvio: tipoEnvio || pedido.tipoEnvio,
        direccion: direccion || pedido.direccion,
        notas: notas !== undefined ? notas : pedido.notas,
      },
      { transaction: t },
    );

    await t.commit();

    const pedidoActualizado = await Pedido.findByPk(pedido.id, {
      include: [{ model: PedidoProducto, as: "productos" }],
    });

    res.json({
      success: true,
      message: "Pedido actualizado",
      data: pedidoActualizado,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// PUT /api/pedidos/:id/estado
exports.cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Verificar permisos según el tipo de usuario
    const esDeposito = pedido.depositoId === req.usuario.id;
    const esCliente = pedido.clienteId === req.usuario.id;
    const esAdmin = req.usuario.tipoUsuario === "admin";

    if (!esDeposito && !esCliente && !esAdmin) {
      throw new AppError("No autorizado", 403);
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      pendiente: ["preparando", "cancelado"],
      preparando: ["listo", "cancelado"],
      listo: ["enviado", "entregado", "cancelado"], // entregado si es retiro
      enviado: ["entregado"],
      entregado: [],
      cancelado: [],
    };

    if (!transicionesValidas[pedido.estado]?.includes(estado)) {
      throw new AppError(
        `No se puede cambiar de ${pedido.estado} a ${estado}`,
        400,
      );
    }

    await pedido.update({
      estado,
      fechaEntrega: estado === "entregado" ? new Date() : pedido.fechaEntrega,
    });

    // Emitir notificación al cliente
    emitirPedidoActualizado(pedido.clienteId, {
      id: pedido.id,
      numero: pedido.numero,
      estado,
    });

    res.json({
      success: true,
      message: `Pedido marcado como ${estado}`,
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/pedidos/:id (cancelar)
exports.cancelarPedido = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Solo el cliente o admin pueden cancelar
    if (
      pedido.clienteId !== req.usuario.id &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Solo se pueden cancelar pedidos pendientes o preparando
    if (!["pendiente", "preparando"].includes(pedido.estado)) {
      throw new AppError("No se puede cancelar este pedido", 400);
    }

    await pedido.update({ estado: "cancelado" });

    res.json({
      success: true,
      message: "Pedido cancelado",
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
};
