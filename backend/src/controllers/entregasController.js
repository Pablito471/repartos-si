const {
  Entrega,
  Pedido,
  Usuario,
  StockCliente,
  PedidoProducto,
  Producto,
  sequelize,
} = require("../models");
const { AppError } = require("../middleware/errorHandler");

// POST /api/entregas - Crear entrega (genera código QR)
exports.crearEntrega = async (req, res, next) => {
  try {
    const { pedidoId } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: PedidoProducto,
          as: "productos",
          include: [
            {
              model: Producto,
              as: "producto",
              attributes: ["id", "codigo", "categoria", "imagen"],
            },
          ],
        },
      ],
    });

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Verificar permisos (solo el depósito del pedido)
    if (
      req.usuario.tipoUsuario !== "admin" &&
      pedido.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Verificar que el pedido está listo o enviado
    if (!["listo", "enviado"].includes(pedido.estado)) {
      throw new AppError("El pedido debe estar listo o enviado", 400);
    }

    // Verificar si ya existe una entrega para este pedido
    const entregaExistente = await Entrega.findOne({ where: { pedidoId } });
    if (entregaExistente) {
      return res.json({
        success: true,
        message: "Entrega ya existe",
        data: entregaExistente,
      });
    }

    // Generar código único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigoEntrega = `ENT-${pedido.numero || pedido.id.substring(0, 8)}-${timestamp}-${random}`;

    // Preparar productos con código de barras
    const productos = pedido.productos.map((p) => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: parseFloat(p.precioUnitario),
      codigoBarras: p.producto?.codigo || null,
      categoria: p.producto?.categoria || "General",
      imagen: p.producto?.imagen || null,
    }));

    const entrega = await Entrega.create({
      codigoEntrega,
      pedidoId,
      clienteId: pedido.clienteId,
      depositoId: pedido.depositoId,
      productos,
      total: parseFloat(pedido.total),
    });

    res.status(201).json({
      success: true,
      message: "Entrega creada",
      data: entrega,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/entregas/:codigo - Obtener entrega por código
exports.getEntregaPorCodigo = async (req, res, next) => {
  try {
    const entrega = await Entrega.findOne({
      where: { codigoEntrega: req.params.codigo },
      include: [
        { model: Pedido, as: "pedido" },
        { model: Usuario, as: "cliente", attributes: ["id", "nombre"] },
        { model: Usuario, as: "depositoOrigen", attributes: ["id", "nombre"] },
      ],
    });

    if (!entrega) {
      throw new AppError("Entrega no encontrada", 404);
    }

    res.json({
      success: true,
      data: entrega,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/entregas/:codigo/confirmar - Confirmar entrega (cliente escanea QR)
exports.confirmarEntrega = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const entrega = await Entrega.findOne({
      where: { codigoEntrega: req.params.codigo },
    });

    if (!entrega) {
      throw new AppError("Entrega no encontrada", 404);
    }

    if (entrega.confirmada) {
      throw new AppError("Esta entrega ya fue confirmada", 400);
    }

    // Verificar que el usuario es el cliente de la entrega
    if (
      entrega.clienteId !== req.usuario.id &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado. Solo el cliente puede confirmar", 403);
    }

    // Confirmar entrega
    await entrega.update(
      {
        confirmada: true,
        fechaConfirmacion: new Date(),
      },
      { transaction: t },
    );

    // Agregar productos al stock del cliente
    for (const producto of entrega.productos) {
      // Buscar si ya existe el producto en el stock
      const stockExistente = await StockCliente.findOne({
        where: {
          clienteId: entrega.clienteId,
          nombre: producto.nombre,
        },
        transaction: t,
      });

      if (stockExistente) {
        // Actualizar cantidad
        await stockExistente.update(
          {
            cantidad: stockExistente.cantidad + producto.cantidad,
          },
          { transaction: t },
        );
      } else {
        // Crear nuevo registro de stock con código de barras
        await StockCliente.create(
          {
            clienteId: entrega.clienteId,
            nombre: producto.nombre,
            cantidad: producto.cantidad,
            precio: producto.precio,
            entregaId: entrega.id,
            codigoBarras: producto.codigoBarras || null,
            categoria: producto.categoria || "General",
            imagen: producto.imagen || null,
          },
          { transaction: t },
        );
      }
    }

    // Actualizar estado del pedido si aún no está entregado
    await Pedido.update(
      { estado: "entregado", fechaEntrega: new Date() },
      { where: { id: entrega.pedidoId }, transaction: t },
    );

    await t.commit();

    res.json({
      success: true,
      message: "Entrega confirmada. Productos agregados al stock.",
      data: entrega,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// GET /api/entregas/cliente/pendientes
exports.getEntregasPendientesCliente = async (req, res, next) => {
  try {
    const entregas = await Entrega.findAll({
      where: {
        clienteId: req.usuario.id,
        confirmada: false,
      },
      include: [
        { model: Usuario, as: "depositoOrigen", attributes: ["id", "nombre"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: entregas,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock
exports.getStockCliente = async (req, res, next) => {
  try {
    const stock = await StockCliente.findAll({
      where: { clienteId: req.usuario.id },
      order: [["nombre", "ASC"]],
    });

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/entregas/historial
exports.getHistorialEntregas = async (req, res, next) => {
  try {
    const entregas = await Entrega.findAll({
      where: {
        clienteId: req.usuario.id,
        confirmada: true,
      },
      include: [
        { model: Usuario, as: "depositoOrigen", attributes: ["id", "nombre"] },
      ],
      order: [["fechaConfirmacion", "DESC"]],
    });

    res.json({
      success: true,
      data: entregas,
    });
  } catch (error) {
    next(error);
  }
};
