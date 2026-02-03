const {
  StockCliente,
  Usuario,
  Pedido,
  PedidoProducto,
  Movimiento,
} = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// GET /api/stock - Obtener stock del cliente autenticado
exports.obtenerStock = async (req, res, next) => {
  try {
    const stock = await StockCliente.findAll({
      where: { clienteId: req.usuario.id },
      order: [["nombre", "ASC"]],
    });

    // Agrupar por nombre de producto y sumar cantidades
    const stockAgrupado = {};
    stock.forEach((item) => {
      if (!stockAgrupado[item.nombre]) {
        stockAgrupado[item.nombre] = {
          id: item.id,
          nombre: item.nombre,
          cantidad: 0,
          precio: parseFloat(item.precio) || 0,
          ultimaActualizacion: item.updatedAt,
        };
      }
      stockAgrupado[item.nombre].cantidad += item.cantidad;
      // Mantener la fecha más reciente
      if (
        new Date(item.updatedAt) >
        new Date(stockAgrupado[item.nombre].ultimaActualizacion)
      ) {
        stockAgrupado[item.nombre].ultimaActualizacion = item.updatedAt;
      }
    });

    res.json({
      success: true,
      data: Object.values(stockAgrupado),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/detallado - Obtener stock con detalle de cada entrada
exports.obtenerStockDetallado = async (req, res, next) => {
  try {
    const stock = await StockCliente.findAll({
      where: { clienteId: req.usuario.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/totales - Obtener totales del stock
exports.obtenerTotales = async (req, res, next) => {
  try {
    const stock = await StockCliente.findAll({
      where: { clienteId: req.usuario.id },
    });

    const totalProductos = stock.reduce((sum, item) => sum + item.cantidad, 0);
    const valorTotal = stock.reduce(
      (sum, item) => sum + item.cantidad * parseFloat(item.precio || 0),
      0,
    );
    const productosUnicos = new Set(stock.map((item) => item.nombre)).size;

    res.json({
      success: true,
      data: {
        totalProductos,
        valorTotal,
        productosUnicos,
        totalEntradas: stock.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/agregar-desde-pedido/:pedidoId - Agregar productos al stock desde un pedido entregado
exports.agregarDesdePedido = async (req, res, next) => {
  try {
    const { pedidoId } = req.params;

    // Buscar el pedido con sus productos
    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: PedidoProducto,
          as: "productos",
        },
      ],
    });

    if (!pedido) {
      throw new AppError("Pedido no encontrado", 404);
    }

    // Verificar que el pedido pertenece al cliente
    if (pedido.clienteId !== req.usuario.id) {
      throw new AppError("No autorizado", 403);
    }

    // Verificar que el pedido está entregado
    if (pedido.estado !== "entregado") {
      throw new AppError("El pedido no ha sido entregado aún", 400);
    }

    // Verificar si ya se agregó este pedido al stock
    const yaAgregado = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        entregaId: pedidoId, // Usamos entregaId para guardar referencia al pedido
      },
    });

    if (yaAgregado) {
      throw new AppError(
        "Los productos de este pedido ya fueron agregados al stock",
        400,
      );
    }

    // Agregar cada producto al stock
    const productosAgregados = [];
    for (const producto of pedido.productos) {
      const stockItem = await StockCliente.create({
        clienteId: req.usuario.id,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        precio: producto.precioUnitario,
        entregaId: pedidoId, // Guardamos referencia al pedido
      });
      productosAgregados.push(stockItem);
    }

    res.status(201).json({
      success: true,
      message: `${productosAgregados.length} productos agregados al stock`,
      data: productosAgregados,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/agregar - Agregar producto manualmente al stock
exports.agregarProducto = async (req, res, next) => {
  try {
    const { nombre, cantidad, precio, registrarCompra } = req.body;

    if (!nombre || !cantidad) {
      throw new AppError("Nombre y cantidad son requeridos", 400);
    }

    const stockItem = await StockCliente.create({
      clienteId: req.usuario.id,
      nombre,
      cantidad: parseInt(cantidad),
      precio: precio ? parseFloat(precio) : null,
    });

    // Registrar movimiento contable de egreso (compra) si tiene precio y se indica
    if (registrarCompra && precio && parseFloat(precio) > 0) {
      const montoCompra = parseFloat(precio) * parseInt(cantidad);
      await Movimiento.create({
        usuarioId: req.usuario.id,
        tipo: "egreso",
        concepto: `Compra: ${cantidad}x ${nombre}`,
        monto: montoCompra,
        categoria: "compras",
        notas: "Ingreso manual de stock",
      });
    }

    res.status(201).json({
      success: true,
      message: "Producto agregado al stock",
      data: stockItem,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/stock/:id - Actualizar cantidad de un producto
exports.actualizarStock = async (req, res, next) => {
  try {
    const stockItem = await StockCliente.findOne({
      where: {
        id: req.params.id,
        clienteId: req.usuario.id,
      },
    });

    if (!stockItem) {
      throw new AppError("Producto no encontrado en el stock", 404);
    }

    const { cantidad, precio, nombre } = req.body;

    await stockItem.update({
      cantidad:
        cantidad !== undefined ? parseInt(cantidad) : stockItem.cantidad,
      precio: precio !== undefined ? parseFloat(precio) : stockItem.precio,
      nombre: nombre || stockItem.nombre,
    });

    res.json({
      success: true,
      message: "Stock actualizado",
      data: stockItem,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/stock/:id - Eliminar un producto del stock (por ID o por nombre)
exports.eliminarProducto = async (req, res, next) => {
  try {
    const idOrName = req.params.id;

    // Verificar si es un UUID o un nombre
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrName,
      );

    if (isUUID) {
      // Eliminar por ID específico
      const stockItem = await StockCliente.findOne({
        where: {
          id: idOrName,
          clienteId: req.usuario.id,
        },
      });

      if (!stockItem) {
        throw new AppError("Producto no encontrado en el stock", 404);
      }

      await stockItem.destroy();

      res.json({
        success: true,
        message: "Producto eliminado del stock",
      });
    } else {
      // Eliminar todos los productos con ese nombre
      const eliminados = await StockCliente.destroy({
        where: {
          nombre: idOrName,
          clienteId: req.usuario.id,
        },
      });

      if (eliminados === 0) {
        throw new AppError("Producto no encontrado en el stock", 404);
      }

      res.json({
        success: true,
        message: `Se eliminaron ${eliminados} registro(s) de "${idOrName}"`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/descontar - Descontar cantidad de un producto (venta)
exports.descontarStock = async (req, res, next) => {
  try {
    const { nombre, cantidad, motivo, precioVenta } = req.body;

    if (!nombre || !cantidad) {
      throw new AppError("Nombre y cantidad son requeridos", 400);
    }

    // Buscar productos con ese nombre
    const stockItems = await StockCliente.findAll({
      where: {
        clienteId: req.usuario.id,
        nombre: nombre,
      },
      order: [["createdAt", "ASC"]], // FIFO - primero los más antiguos
    });

    if (stockItems.length === 0) {
      throw new AppError(`No hay stock de "${nombre}"`, 400);
    }

    const totalDisponible = stockItems.reduce(
      (sum, item) => sum + item.cantidad,
      0,
    );

    if (totalDisponible < cantidad) {
      throw new AppError(
        `Stock insuficiente. Disponible: ${totalDisponible}, Solicitado: ${cantidad}`,
        400,
      );
    }

    // Calcular el valor de venta (usar precioVenta si viene, sino el precio del stock)
    const precioUnitario =
      precioVenta ||
      (stockItems[0]?.precio ? parseFloat(stockItems[0].precio) : 0);
    const montoVenta = precioUnitario * parseInt(cantidad);

    // Descontar del stock (FIFO)
    let cantidadRestante = parseInt(cantidad);
    for (const item of stockItems) {
      if (cantidadRestante <= 0) break;

      if (item.cantidad <= cantidadRestante) {
        // Eliminar este item completamente
        cantidadRestante -= item.cantidad;
        await item.destroy();
      } else {
        // Descontar parcialmente
        await item.update({ cantidad: item.cantidad - cantidadRestante });
        cantidadRestante = 0;
      }
    }

    // Registrar movimiento contable de ingreso (venta)
    if (montoVenta > 0) {
      await Movimiento.create({
        usuarioId: req.usuario.id,
        tipo: "ingreso",
        concepto: `Venta: ${cantidad}x ${nombre}`,
        monto: montoVenta,
        categoria: "ventas",
        notas: motivo || "Venta de stock",
      });
    }

    res.json({
      success: true,
      message: `Se descontaron ${cantidad} unidades de "${nombre}"`,
      data: {
        producto: nombre,
        cantidadDescontada: parseInt(cantidad),
        motivo: motivo || "Venta",
        montoVenta: montoVenta,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/historial - Obtener historial de entregas que agregaron stock
exports.obtenerHistorial = async (req, res, next) => {
  try {
    // Obtener pedidos entregados del cliente
    const pedidosEntregados = await Pedido.findAll({
      where: {
        clienteId: req.usuario.id,
        estado: "entregado",
      },
      include: [
        {
          model: PedidoProducto,
          as: "productos",
        },
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fechaEntrega", "DESC"]],
    });

    // Verificar cuáles ya fueron agregados al stock
    const historial = await Promise.all(
      pedidosEntregados.map(async (pedido) => {
        const yaAgregado = await StockCliente.findOne({
          where: {
            clienteId: req.usuario.id,
            entregaId: pedido.id,
          },
        });

        return {
          pedidoId: pedido.id,
          numero: pedido.numero,
          deposito: pedido.deposito?.nombre,
          productos: pedido.productos,
          total: parseFloat(pedido.total),
          fechaEntrega: pedido.fechaEntrega,
          agregadoAlStock: !!yaAgregado,
        };
      }),
    );

    res.json({
      success: true,
      data: historial,
    });
  } catch (error) {
    next(error);
  }
};
