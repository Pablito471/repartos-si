const { Movimiento, Usuario, Pedido } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// GET /api/movimientos
exports.listar = async (req, res, next) => {
  try {
    const { tipo, categoria, fechaDesde, fechaHasta, limite } = req.query;

    const where = { usuarioId: req.usuario.id };

    if (tipo) {
      where.tipo = tipo;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.createdAt[Op.lte] = new Date(fechaHasta + "T23:59:59");
      }
    }

    const movimientos = await Movimiento.findAll({
      where,
      include: [
        {
          model: Pedido,
          as: "pedido",
          attributes: ["id", "numero", "total"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limite ? parseInt(limite) : 100,
    });

    res.json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/movimientos/totales
exports.obtenerTotales = async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    const where = { usuarioId: req.usuario.id };

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.createdAt[Op.lte] = new Date(fechaHasta + "T23:59:59");
      }
    }

    const movimientos = await Movimiento.findAll({ where });

    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);

    const egresos = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto), 0);

    // Totales por categoría
    const categorias = {};
    movimientos.forEach((m) => {
      if (!categorias[m.categoria]) {
        categorias[m.categoria] = { ingresos: 0, egresos: 0 };
      }
      if (m.tipo === "ingreso") {
        categorias[m.categoria].ingresos += parseFloat(m.monto);
      } else {
        categorias[m.categoria].egresos += parseFloat(m.monto);
      }
    });

    // Totales por mes (últimos 6 meses)
    const porMes = {};
    const ahora = new Date();
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      porMes[clave] = { ingresos: 0, egresos: 0 };
    }

    movimientos.forEach((m) => {
      const fecha = new Date(m.createdAt);
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      if (porMes[clave]) {
        if (m.tipo === "ingreso") {
          porMes[clave].ingresos += parseFloat(m.monto);
        } else {
          porMes[clave].egresos += parseFloat(m.monto);
        }
      }
    });

    res.json({
      success: true,
      data: {
        ingresos,
        egresos,
        balance: ingresos - egresos,
        categorias,
        porMes,
        totalMovimientos: movimientos.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/movimientos/:id
exports.obtenerPorId = async (req, res, next) => {
  try {
    const movimiento = await Movimiento.findOne({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id,
      },
      include: [
        {
          model: Pedido,
          as: "pedido",
          attributes: ["id", "numero", "total", "estado"],
        },
      ],
    });

    if (!movimiento) {
      throw new AppError("Movimiento no encontrado", 404);
    }

    res.json({
      success: true,
      data: movimiento,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/movimientos
exports.crear = async (req, res, next) => {
  try {
    const { tipo, concepto, monto, categoria, pedidoId, notas } = req.body;

    if (!tipo || !concepto || !monto) {
      throw new AppError("Tipo, concepto y monto son requeridos", 400);
    }

    if (!["ingreso", "egreso"].includes(tipo)) {
      throw new AppError("Tipo debe ser 'ingreso' o 'egreso'", 400);
    }

    if (parseFloat(monto) <= 0) {
      throw new AppError("El monto debe ser mayor a 0", 400);
    }

    const movimiento = await Movimiento.create({
      usuarioId: req.usuario.id,
      tipo,
      concepto,
      monto: parseFloat(monto),
      categoria: categoria || "otros",
      pedidoId: pedidoId || null,
      notas: notas || null,
    });

    res.status(201).json({
      success: true,
      message: "Movimiento registrado",
      data: movimiento,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/movimientos/:id
exports.actualizar = async (req, res, next) => {
  try {
    const movimiento = await Movimiento.findOne({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id,
      },
    });

    if (!movimiento) {
      throw new AppError("Movimiento no encontrado", 404);
    }

    const { tipo, concepto, monto, categoria, notas } = req.body;

    await movimiento.update({
      tipo: tipo || movimiento.tipo,
      concepto: concepto || movimiento.concepto,
      monto: monto ? parseFloat(monto) : movimiento.monto,
      categoria: categoria || movimiento.categoria,
      notas: notas !== undefined ? notas : movimiento.notas,
    });

    res.json({
      success: true,
      message: "Movimiento actualizado",
      data: movimiento,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/movimientos/:id
exports.eliminar = async (req, res, next) => {
  try {
    const movimiento = await Movimiento.findOne({
      where: {
        id: req.params.id,
        usuarioId: req.usuario.id,
      },
    });

    if (!movimiento) {
      throw new AppError("Movimiento no encontrado", 404);
    }

    await movimiento.destroy();

    res.json({
      success: true,
      message: "Movimiento eliminado",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/movimientos/registrar-pedido
// Registra automáticamente un movimiento cuando se crea un pedido
exports.registrarPedido = async (req, res, next) => {
  try {
    const { pedidoId, tipo } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        { model: Usuario, as: "cliente", attributes: ["id", "nombre"] },
        { model: Usuario, as: "deposito", attributes: ["id", "nombre"] },
      ],
    });

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Determinar quién registra (cliente o depósito)
    const esCliente = pedido.clienteId === req.usuario.id;
    const esDeposito = pedido.depositoId === req.usuario.id;

    if (!esCliente && !esDeposito) {
      throw new AppError("No autorizado", 403);
    }

    let movimientoTipo, concepto, categoria;

    if (esCliente) {
      // Para el cliente: el pedido es un egreso (compra)
      movimientoTipo = "egreso";
      concepto = `Pedido #${pedido.numero} - ${pedido.deposito.nombre}`;
      categoria = "compras";
    } else {
      // Para el depósito: el pedido es un ingreso (venta)
      movimientoTipo = "ingreso";
      concepto = `Pedido #${pedido.numero} - ${pedido.cliente.nombre}`;
      categoria = "ventas";
    }

    const movimiento = await Movimiento.create({
      usuarioId: req.usuario.id,
      tipo: movimientoTipo,
      concepto,
      monto: parseFloat(pedido.total),
      categoria,
      pedidoId: pedido.id,
    });

    res.status(201).json({
      success: true,
      message: "Movimiento de pedido registrado",
      data: movimiento,
    });
  } catch (error) {
    next(error);
  }
};
