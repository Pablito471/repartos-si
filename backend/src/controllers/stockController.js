const {
  StockCliente,
  Usuario,
  Pedido,
  PedidoProducto,
  Movimiento,
  Producto,
  CodigoAlternativo,
  CodigoAlternativoCliente,
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
          precioCosto:
            parseFloat(item.precioCosto) || parseFloat(item.precio) || 0,
          precioVenta:
            parseFloat(item.precioVenta) || parseFloat(item.precio) || 0,
          precio: parseFloat(item.precioVenta) || parseFloat(item.precio) || 0, // Mantener para compatibilidad
          categoria: item.categoria || "General",
          imagen: item.imagen || null,
          codigoBarras: item.codigoBarras || null,
          ultimaActualizacion: item.updatedAt,
        };
      }
      stockAgrupado[item.nombre].cantidad += item.cantidad;
      // Mantener la fecha más reciente y la imagen si existe
      if (
        new Date(item.updatedAt) >
        new Date(stockAgrupado[item.nombre].ultimaActualizacion)
      ) {
        stockAgrupado[item.nombre].ultimaActualizacion = item.updatedAt;
      }
      // Si el item actual tiene imagen y el agrupado no, usar la del item
      if (item.imagen && !stockAgrupado[item.nombre].imagen) {
        stockAgrupado[item.nombre].imagen = item.imagen;
      }
      // Si el item actual tiene código de barras y el agrupado no, usar el del item
      if (item.codigoBarras && !stockAgrupado[item.nombre].codigoBarras) {
        stockAgrupado[item.nombre].codigoBarras = item.codigoBarras;
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

// GET /api/stock/categorias - Obtener categorías del cliente
exports.obtenerCategorias = async (req, res, next) => {
  try {
    const stock = await StockCliente.findAll({
      where: {
        clienteId: req.usuario.id,
        categoria: { [Op.ne]: null },
      },
      attributes: ["categoria"],
      group: ["categoria"],
    });

    // Extraer categorías únicas y agregar "General" si no existe
    const categoriasSet = new Set(
      stock.map((item) => item.categoria).filter(Boolean),
    );
    categoriasSet.add("General"); // Siempre incluir General

    const categorias = Array.from(categoriasSet).sort();

    res.json({
      success: true,
      data: categorias,
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
      (sum, item) =>
        sum + item.cantidad * parseFloat(item.precioVenta || item.precio || 0),
      0,
    );
    const costoTotal = stock.reduce(
      (sum, item) =>
        sum + item.cantidad * parseFloat(item.precioCosto || item.precio || 0),
      0,
    );
    const productosUnicos = new Set(stock.map((item) => item.nombre)).size;

    res.json({
      success: true,
      data: {
        totalProductos,
        valorTotal,
        costoTotal,
        gananciaTotal: valorTotal - costoTotal,
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

    // Buscar el pedido con sus productos e incluir el producto original para obtener el código
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
        pedidoId: pedidoId,
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
        precioCosto: producto.precioUnitario, // El precio del pedido es el costo
        precioVenta: null, // El cliente debe configurar su precio de venta
        precio: producto.precioUnitario, // Legacy
        pedidoId: pedidoId,
        // Agregar código de barras del producto original si existe
        codigoBarras: producto.producto?.codigo || null,
        categoria: producto.producto?.categoria || "General",
        imagen: producto.producto?.imagen || null,
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
    const {
      nombre,
      cantidad,
      precio,
      precioCosto,
      precioVenta,
      registrarCompra,
      codigoBarras,
      categoria,
      imagen,
      esGranel,
      unidadMedida,
      precioUnidad,
    } = req.body;
    if (!nombre || !cantidad) {
      throw new AppError("Nombre y cantidad son requeridos", 400);
    }

    // Normalizar nombre a mayúsculas
    const nombreMayusculas = nombre.trim().toUpperCase();

    // Si tiene código de barras, verificar que no exista ya para este cliente
    if (codigoBarras) {
      const codigoExistente = await StockCliente.findOne({
        where: {
          clienteId: req.usuario.id,
          codigoBarras: codigoBarras,
        },
      });

      if (codigoExistente) {
        throw new AppError(
          `Ya existe un producto con este código de barras: ${codigoExistente.nombre}`,
          400,
        );
      }
    }

    // Determinar los precios a usar
    const costoParsed = precioCosto
      ? parseFloat(precioCosto)
      : precio
        ? parseFloat(precio)
        : null;
    const ventaParsed = precioVenta
      ? parseFloat(precioVenta)
      : precio
        ? parseFloat(precio)
        : null;

    const stockItem = await StockCliente.create({
      clienteId: req.usuario.id,
      nombre: nombreMayusculas,
      cantidad: parseFloat(cantidad),
      precioCosto: costoParsed,
      precioVenta: ventaParsed,
      precio: ventaParsed, // Mantener para compatibilidad
      codigoBarras: codigoBarras || null,
      categoria: categoria || "General",
      imagen: imagen || null,
      esGranel: esGranel || false,
      unidadMedida: unidadMedida || "unidad",
      precioUnidad: precioUnidad ? parseFloat(precioUnidad) : null,
    });

    // Registrar movimiento contable de egreso (compra) si tiene precio de costo y se indica
    const precioParaCompra = costoParsed || ventaParsed || 0;
    if (registrarCompra && precioParaCompra > 0) {
      const montoCompra = precioParaCompra * parseInt(cantidad);
      await Movimiento.create({
        usuarioId: req.usuario.id,
        tipo: "egreso",
        concepto: `Compra: ${cantidad}x ${nombreMayusculas}`,
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

    const { cantidad, precio, precioCosto, precioVenta, nombre } = req.body;

    await stockItem.update({
      cantidad:
        cantidad !== undefined ? parseInt(cantidad) : stockItem.cantidad,
      precioCosto:
        precioCosto !== undefined
          ? parseFloat(precioCosto)
          : stockItem.precioCosto,
      precioVenta:
        precioVenta !== undefined
          ? parseFloat(precioVenta)
          : stockItem.precioVenta,
      precio:
        precioVenta !== undefined
          ? parseFloat(precioVenta)
          : precio !== undefined
            ? parseFloat(precio)
            : stockItem.precio,
      nombre: nombre ? nombre.trim().toUpperCase() : stockItem.nombre,
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
    const {
      nombre,
      cantidad,
      motivo,
      precioVenta,
      registrarVenta = true,
    } = req.body;

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

    // Registrar movimiento contable de ingreso (venta) solo si se indica
    if (registrarVenta && montoVenta > 0) {
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

// POST /api/stock/descontar-por-codigo - Descontar por código de barras
exports.descontarPorCodigo = async (req, res, next) => {
  try {
    const { codigo, cantidad = 1, motivo, precioVenta } = req.body;

    if (!codigo) {
      throw new AppError("Código de barras requerido", 400);
    }

    let stockItem = null;

    // Primero buscar por código de barras personalizado
    stockItem = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        codigoBarras: codigo,
      },
    });

    // Si no encontró, intentar con formato STK000001 (código interno)
    if (!stockItem) {
      const match = codigo.match(/^STK0*(\d+)$/);
      if (match) {
        const stockId = parseInt(match[1]);
        stockItem = await StockCliente.findOne({
          where: {
            id: stockId,
            clienteId: req.usuario.id,
          },
        });
      }
    }

    if (!stockItem) {
      throw new AppError("Producto no encontrado en tu stock", 404);
    }

    const nombreProducto = stockItem.nombre;

    // Ahora buscar todos los items con ese nombre para el descuento FIFO
    const stockItems = await StockCliente.findAll({
      where: {
        clienteId: req.usuario.id,
        nombre: nombreProducto,
      },
      order: [["createdAt", "ASC"]], // FIFO
    });

    const totalDisponible = stockItems.reduce(
      (sum, item) => sum + item.cantidad,
      0,
    );

    if (totalDisponible < cantidad) {
      throw new AppError(
        `Stock insuficiente de "${nombreProducto}". Disponible: ${totalDisponible}, Solicitado: ${cantidad}`,
        400,
      );
    }

    // Calcular precio
    const precioUnitario =
      precioVenta ||
      (stockItems[0]?.precio ? parseFloat(stockItems[0].precio) : 0);
    const montoVenta = precioUnitario * parseInt(cantidad);

    // Descontar del stock (FIFO)
    let cantidadRestante = parseInt(cantidad);
    for (const item of stockItems) {
      if (cantidadRestante <= 0) break;

      if (item.cantidad <= cantidadRestante) {
        cantidadRestante -= item.cantidad;
        await item.destroy();
      } else {
        await item.update({ cantidad: item.cantidad - cantidadRestante });
        cantidadRestante = 0;
      }
    }

    // Registrar movimiento contable de ingreso (venta)
    if (montoVenta > 0) {
      await Movimiento.create({
        usuarioId: req.usuario.id,
        tipo: "ingreso",
        concepto: `Venta (escáner): ${cantidad}x ${nombreProducto}`,
        monto: montoVenta,
        categoria: "ventas",
        notas: motivo || "Venta por escáner de código de barras",
      });
    }

    res.json({
      success: true,
      message: `Se descontó ${cantidad} unidad(es) de "${nombreProducto}"`,
      data: {
        codigo: codigo,
        producto: nombreProducto,
        cantidadDescontada: parseInt(cantidad),
        stockRestante: totalDisponible - cantidad,
        precioUnitario: precioUnitario,
        montoVenta: montoVenta,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/buscar-por-codigo/:codigo - Buscar producto por código de barras
exports.buscarPorCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    // Normalizar código de barras (trim y mayúsculas)
    const codigoNormalizado = codigo.trim().toUpperCase();

    let stockItem = null;
    let esCodigoAlternativo = false;

    // 1. Primero buscar por código de barras personalizado en StockCliente
    stockItem = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        codigoBarras: codigoNormalizado,
      },
    });

    // 2. Si no encontró, intentar con formato STK000001 (código interno)
    if (!stockItem) {
      const match = codigo.match(/^STK0*(\d+)$/);
      if (match) {
        const stockId = parseInt(match[1]);
        stockItem = await StockCliente.findOne({
          where: {
            id: stockId,
            clienteId: req.usuario.id,
          },
        });
      }
    }

    // 3. Buscar en códigos alternativos del cliente (CodigoAlternativoCliente)
    if (!stockItem) {
      const codigoAltCliente = await CodigoAlternativoCliente.findOne({
        where: {
          clienteId: req.usuario.id,
          codigo: codigoNormalizado,
          activo: true,
        },
      });

      if (codigoAltCliente) {
        // Buscar por nombre del producto
        stockItem = await StockCliente.findOne({
          where: {
            clienteId: req.usuario.id,
            nombre: codigoAltCliente.nombreProducto,
          },
        });

        if (stockItem) {
          esCodigoAlternativo = true;
        }
      }
    }

    // 4. Si no encontró, buscar en códigos alternativos de depósitos (para productos recibidos)
    if (!stockItem) {
      const codigoAlt = await CodigoAlternativo.findOne({
        where: {
          codigo: codigoNormalizado,
          activo: true,
        },
        include: [
          {
            model: Producto,
            as: "producto",
            where: { activo: true },
          },
        ],
      });

      if (codigoAlt && codigoAlt.producto) {
        // Buscar si el cliente tiene este producto en su stock (por nombre)
        stockItem = await StockCliente.findOne({
          where: {
            clienteId: req.usuario.id,
            nombre: codigoAlt.producto.nombre,
          },
        });

        if (stockItem) {
          esCodigoAlternativo = true;
        }
      }
    }

    if (!stockItem) {
      throw new AppError("Producto no encontrado en tu stock", 404);
    }

    // Obtener cantidad total de este producto (por nombre)
    const stockItems = await StockCliente.findAll({
      where: {
        clienteId: req.usuario.id,
        nombre: stockItem.nombre,
      },
    });

    const totalDisponible = stockItems.reduce(
      (sum, item) => sum + item.cantidad,
      0,
    );

    res.json({
      success: true,
      data: {
        id: stockItem.id,
        codigo: stockItem.codigoBarras || codigo,
        nombre: stockItem.nombre,
        precio: parseFloat(stockItem.precio) || 0,
        costo: parseFloat(stockItem.precioCosto) || 0,
        cantidadDisponible: totalDisponible,
        categoria: stockItem.categoria || "General",
        esCodigoAlternativo,
        esGranel: stockItem.esGranel,
        unidadMedida: stockItem.unidadMedida,
        precioUnidad: stockItem.precioUnidad ? parseFloat(stockItem.precioUnidad) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stock/buscar?termino=xxx - Buscar productos por nombre
exports.buscarProductos = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Buscar productos que coincidan con el término
    const stock = await StockCliente.findAll({
      where: {
        clienteId: req.usuario.id,
        nombre: {
          [Op.iLike]: `%${termino}%`,
        },
      },
      order: [["nombre", "ASC"]],
    });

    // Agrupar por nombre para evitar duplicados
    const productosUnicos = {};
    stock.forEach((item) => {
      if (!productosUnicos[item.nombre]) {
        productosUnicos[item.nombre] = {
          id: item.id,
          nombre: item.nombre,
          cantidad: 0,
          precio: parseFloat(item.precio) || 0,
          costo: parseFloat(item.precioCosto) || 0,
          categoria: item.categoria || "General",
          codigoBarras: item.codigoBarras || null,
        };
      }
      productosUnicos[item.nombre].cantidad += item.cantidad;
    });

    res.json({
      success: true,
      data: Object.values(productosUnicos),
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
            pedidoId: pedido.id,
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

// POST /api/stock/generar-codigo - Generar o obtener código de barras para un producto
exports.generarCodigoBarras = async (req, res, next) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      throw new AppError("Nombre del producto es requerido", 400);
    }

    // Buscar el primer registro de stock con este nombre (donde está agrupado)
    const stockItem = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        nombre: nombre,
      },
      order: [["createdAt", "ASC"]], // El más antiguo primero
    });

    if (!stockItem) {
      throw new AppError("Producto no encontrado en tu stock", 404);
    }

    // Si ya tiene código de barras, devolverlo
    if (stockItem.codigoBarras) {
      return res.json({
        success: true,
        data: {
          codigo: stockItem.codigoBarras,
          nombre: stockItem.nombre,
          esNuevo: false,
        },
      });
    }

    // Generar un nuevo código usando los primeros 8 caracteres del UUID
    const codigoUnico = `STK${stockItem.id.replace(/-/g, "").substring(0, 8).toUpperCase()}`;

    // Guardar el código en el registro
    await stockItem.update({ codigoBarras: codigoUnico });

    // También actualizar otros registros del mismo producto (para consistencia)
    await StockCliente.update(
      { codigoBarras: codigoUnico },
      {
        where: {
          clienteId: req.usuario.id,
          nombre: nombre,
          codigoBarras: null,
        },
      },
    );

    res.json({
      success: true,
      data: {
        codigo: codigoUnico,
        nombre: stockItem.nombre,
        esNuevo: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/agregar-stock/:codigo - Agregar stock a producto existente por código de barras
exports.agregarStockPorCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const { cantidad, precioCosto } = req.body;

    if (!cantidad || parseInt(cantidad) < 1) {
      throw new AppError("La cantidad debe ser al menos 1", 400);
    }

    // Normalizar código de barras (trim y mayúsculas)
    const codigoNormalizado = codigo.trim().toUpperCase();

    // Buscar producto por código de barras
    const stockItem = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        codigoBarras: codigoNormalizado,
      },
    });

    if (!stockItem) {
      throw new AppError(`No se encontró producto con código: ${codigo}`, 404);
    }

    // Agregar nueva entrada de stock (acumular al existente)
    const nuevaCantidad = stockItem.cantidad + parseInt(cantidad);
    const nuevoPrecioCosto = precioCosto
      ? parseFloat(precioCosto)
      : stockItem.precioCosto;

    // Actualizar el item de stock
    await stockItem.update({
      cantidad: nuevaCantidad,
      precioCosto: nuevoPrecioCosto,
    });

    // Registrar movimiento contable de egreso (compra) si tiene precio de costo
    if (precioCosto && parseFloat(precioCosto) > 0) {
      const montoCompra = parseFloat(precioCosto) * parseInt(cantidad);
      await Movimiento.create({
        usuarioId: req.usuario.id,
        tipo: "egreso",
        concepto: `Agregar stock: ${cantidad}x ${stockItem.nombre}`,
        monto: montoCompra,
        categoria: "compras",
        notas: `Agregado por código ${codigo}`,
      });
    }

    res.json({
      success: true,
      message: `Agregadas ${cantidad} unidades a "${stockItem.nombre}". Total: ${nuevaCantidad}`,
      data: {
        nombre: stockItem.nombre,
        codigoBarras: codigo,
        cantidadAnterior: stockItem.cantidad,
        cantidadAgregada: parseInt(cantidad),
        cantidadTotal: nuevaCantidad,
        precioCosto: nuevoPrecioCosto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/asociar-codigo - Asociar un código alternativo a un producto del stock
exports.asociarCodigoAlternativo = async (req, res, next) => {
  try {
    const { nombreProducto, codigo, cantidad } = req.body;

    if (!nombreProducto || !codigo) {
      throw new AppError("Nombre del producto y código son requeridos", 400);
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    // Verificar que el producto exista en el stock del cliente
    const stockItem = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        nombre: nombreProducto,
      },
    });

    if (!stockItem) {
      throw new AppError(`No tienes "${nombreProducto}" en tu stock`, 404);
    }

    // Verificar que el código no exista ya
    const existeEnStock = await StockCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        codigoBarras: codigoNormalizado,
      },
    });

    if (existeEnStock) {
      throw new AppError(
        `El código "${codigoNormalizado}" ya existe como código principal de "${existeEnStock.nombre}"`,
        400
      );
    }

    const existeAlternativo = await CodigoAlternativoCliente.findOne({
      where: {
        clienteId: req.usuario.id,
        codigo: codigoNormalizado,
        activo: true,
      },
    });

    if (existeAlternativo) {
      throw new AppError(
        `El código "${codigoNormalizado}" ya está asociado a "${existeAlternativo.nombreProducto}"`,
        400
      );
    }

    // Crear código alternativo
    await CodigoAlternativoCliente.create({
      clienteId: req.usuario.id,
      nombreProducto: nombreProducto,
      codigo: codigoNormalizado,
    });

    // Si se especificó cantidad, agregar stock
    let stockAgregado = 0;
    if (cantidad && parseInt(cantidad) > 0) {
      const cantidadNum = parseInt(cantidad);
      const stockAnterior = stockItem.cantidad;
      const nuevoStock = stockAnterior + cantidadNum;
      await stockItem.update({ cantidad: nuevoStock });
      stockAgregado = cantidadNum;
    }

    res.status(201).json({
      success: true,
      message: `Código "${codigoNormalizado}" asociado a "${nombreProducto}"${stockAgregado > 0 ? ` (+${stockAgregado} unidades)` : ""}`,
      data: {
        codigo: codigoNormalizado,
        nombreProducto: nombreProducto,
        stockAgregado,
        stockTotal: stockItem.cantidad + stockAgregado,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/stock/sincronizar-tablas - Sincronizar tabla de códigos alternativos cliente (solo desarrollo)
exports.sincronizarTablas = async (req, res, next) => {
  try {
    const { sequelize } = require("../models");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS codigos_alternativos_cliente (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id UUID NOT NULL REFERENCES usuarios(id),
        nombre_producto VARCHAR(255) NOT NULL,
        codigo VARCHAR(255) NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    res.json({
      success: true,
      message: "Tabla codigos_alternativos_cliente creada o verificada",
    });
  } catch (error) {
    next(error);
  }
};
