const { Usuario, Producto, StockCliente, Movimiento } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

// GET /api/empleados - Obtener empleados del usuario actual
exports.getEmpleados = async (req, res, next) => {
  try {
    // Solo clientes y depósitos pueden tener empleados
    if (!["cliente", "deposito"].includes(req.usuario.tipoUsuario)) {
      throw new AppError("No autorizado", 403);
    }

    const empleados = await Usuario.findAll({
      where: {
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: empleados,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/empleados - Crear nuevo empleado
exports.crearEmpleado = async (req, res, next) => {
  try {
    // Solo clientes y depósitos pueden crear empleados
    if (!["cliente", "deposito"].includes(req.usuario.tipoUsuario)) {
      throw new AppError("No autorizado", 403);
    }

    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      throw new AppError("Nombre, email y contraseña son requeridos", 400);
    }

    // Verificar si el email ya existe
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      throw new AppError("El email ya está registrado", 400);
    }

    // Crear empleado
    const empleado = await Usuario.create({
      nombre,
      email,
      password,
      telefono: telefono || null,
      tipoUsuario: "empleado",
      empleadorId: req.usuario.id,
      tipoEmpleador: req.usuario.tipoUsuario,
      activo: true,
    });

    res.status(201).json({
      success: true,
      message: "Empleado creado exitosamente",
      data: {
        id: empleado.id,
        nombre: empleado.nombre,
        email: empleado.email,
        telefono: empleado.telefono,
        activo: empleado.activo,
        createdAt: empleado.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/empleados/:id - Actualizar empleado
exports.actualizarEmpleado = async (req, res, next) => {
  try {
    const empleado = await Usuario.findOne({
      where: {
        id: req.params.id,
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
    });

    if (!empleado) {
      throw new AppError("Empleado no encontrado", 404);
    }

    const { nombre, telefono, activo } = req.body;

    await empleado.update({
      nombre: nombre || empleado.nombre,
      telefono: telefono !== undefined ? telefono : empleado.telefono,
      activo: activo !== undefined ? activo : empleado.activo,
    });

    res.json({
      success: true,
      message: "Empleado actualizado",
      data: {
        id: empleado.id,
        nombre: empleado.nombre,
        email: empleado.email,
        telefono: empleado.telefono,
        activo: empleado.activo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/empleados/:id/password - Cambiar contraseña del empleado
exports.cambiarPasswordEmpleado = async (req, res, next) => {
  try {
    const empleado = await Usuario.findOne({
      where: {
        id: req.params.id,
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
    });

    if (!empleado) {
      throw new AppError("Empleado no encontrado", 404);
    }

    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
    }

    await empleado.update({ password });

    res.json({
      success: true,
      message: "Contraseña actualizada",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/empleados/:id - Eliminar empleado
exports.eliminarEmpleado = async (req, res, next) => {
  try {
    const empleado = await Usuario.findOne({
      where: {
        id: req.params.id,
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
    });

    if (!empleado) {
      throw new AppError("Empleado no encontrado", 404);
    }

    await empleado.destroy();

    res.json({
      success: true,
      message: "Empleado eliminado",
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/empleados/:id/toggle - Activar/desactivar empleado
exports.toggleEmpleado = async (req, res, next) => {
  try {
    const empleado = await Usuario.findOne({
      where: {
        id: req.params.id,
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
    });

    if (!empleado) {
      throw new AppError("Empleado no encontrado", 404);
    }

    await empleado.update({ activo: !empleado.activo });

    res.json({
      success: true,
      message: empleado.activo ? "Empleado activado" : "Empleado desactivado",
      data: {
        id: empleado.id,
        activo: empleado.activo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== FUNCIONES PARA ESCÁNER DEL EMPLEADO ====================

// GET /api/empleados/escaner/buscar/:codigo - Buscar producto por código (para empleados)
exports.buscarProductoPorCodigo = async (req, res, next) => {
  try {
    if (req.usuario.tipoUsuario !== "empleado") {
      throw new AppError("Solo disponible para empleados", 403);
    }

    const { codigo } = req.params;
    const { empleadorId, tipoEmpleador } = req.usuario;

    if (!empleadorId) {
      throw new AppError("No se encontró el empleador asociado", 400);
    }

    let producto = null;

    if (tipoEmpleador === "deposito") {
      // Buscar en productos del depósito
      producto = await Producto.findOne({
        where: {
          depositoId: empleadorId,
          activo: true,
          [Op.or]: [{ codigo: codigo }, { codigo: { [Op.iLike]: codigo } }],
        },
      });

      if (producto) {
        return res.json({
          success: true,
          data: {
            id: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: parseFloat(producto.precio || 0),
            precioVenta: parseFloat(
              producto.precioVenta || producto.precio || 0,
            ),
            stock: producto.stock,
            imagen: producto.imagen,
            tipo: "deposito",
          },
        });
      }
    } else if (tipoEmpleador === "cliente") {
      // Buscar en stock del cliente
      producto = await StockCliente.findOne({
        where: {
          clienteId: empleadorId,
          [Op.or]: [
            { codigoBarras: codigo },
            { codigoBarras: { [Op.iLike]: codigo } },
          ],
        },
      });

      if (producto) {
        return res.json({
          success: true,
          data: {
            id: producto.id,
            codigo: producto.codigoBarras,
            nombre: producto.nombre,
            categoria: producto.categoria,
            precio: parseFloat(producto.precio || 0),
            precioVenta: parseFloat(
              producto.precioVenta || producto.precio || 0,
            ),
            cantidad: producto.cantidad,
            stock: producto.cantidad,
            imagen: producto.imagen,
            tipo: "cliente",
          },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Producto no encontrado",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/empleados/escaner/vender - Realizar venta (para empleados)
exports.realizarVenta = async (req, res, next) => {
  try {
    if (req.usuario.tipoUsuario !== "empleado") {
      throw new AppError("Solo disponible para empleados", 403);
    }

    const { productoId, cantidad, precioVenta } = req.body;
    const { empleadorId, tipoEmpleador } = req.usuario;

    if (!productoId || !cantidad || cantidad <= 0) {
      throw new AppError("Producto y cantidad son requeridos", 400);
    }

    if (tipoEmpleador === "deposito") {
      // Venta desde depósito
      const producto = await Producto.findOne({
        where: {
          id: productoId,
          depositoId: empleadorId,
          activo: true,
        },
      });

      if (!producto) {
        throw new AppError("Producto no encontrado", 404);
      }

      if (producto.stock < cantidad) {
        throw new AppError(
          `Stock insuficiente. Disponible: ${producto.stock}`,
          400,
        );
      }

      // Descontar stock
      await producto.update({ stock: producto.stock - cantidad });

      // Registrar movimiento de venta
      const precioFinal =
        precioVenta || producto.precioVenta || producto.precio || 0;
      const montoVenta = precioFinal * cantidad;

      if (montoVenta > 0) {
        await Movimiento.create({
          usuarioId: empleadorId,
          tipo: "ingreso",
          concepto: `Venta (empleado): ${cantidad}x ${producto.nombre}`,
          monto: montoVenta,
          categoria: "ventas",
          empleadoId: req.usuario.id,
          notas: `Venta realizada por empleado: ${req.usuario.nombre}`,
        });
      }

      return res.json({
        success: true,
        message: "Venta registrada",
        data: {
          producto: producto.nombre,
          cantidad,
          precioUnitario: precioFinal,
          total: montoVenta,
          stockRestante: producto.stock - cantidad,
        },
      });
    } else if (tipoEmpleador === "cliente") {
      // Venta desde cliente (descontar de su stock)
      const stockItem = await StockCliente.findOne({
        where: {
          id: productoId,
          clienteId: empleadorId,
        },
      });

      if (!stockItem) {
        throw new AppError("Producto no encontrado en stock", 404);
      }

      if (stockItem.cantidad < cantidad) {
        throw new AppError(
          `Stock insuficiente. Disponible: ${stockItem.cantidad}`,
          400,
        );
      }

      // Descontar stock
      const nuevaCantidad = stockItem.cantidad - cantidad;

      if (nuevaCantidad <= 0) {
        await stockItem.destroy();
      } else {
        await stockItem.update({ cantidad: nuevaCantidad });
      }

      // Registrar movimiento de venta
      const precioFinal =
        precioVenta || stockItem.precioVenta || stockItem.precio || 0;
      const montoVenta = precioFinal * cantidad;

      if (montoVenta > 0) {
        await Movimiento.create({
          usuarioId: empleadorId,
          tipo: "ingreso",
          concepto: `Venta (empleado): ${cantidad}x ${stockItem.nombre}`,
          monto: montoVenta,
          categoria: "ventas",
          empleadoId: req.usuario.id,
          notas: `Venta realizada por empleado: ${req.usuario.nombre}`,
        });
      }

      return res.json({
        success: true,
        message: "Venta registrada",
        data: {
          producto: stockItem.nombre,
          cantidad,
          precioUnitario: precioFinal,
          total: montoVenta,
          stockRestante: nuevaCantidad,
        },
      });
    }

    throw new AppError("Tipo de empleador no válido", 400);
  } catch (error) {
    next(error);
  }
};

// POST /api/empleados/escaner/agregar-stock - Agregar producto al stock (para empleados)
exports.agregarStock = async (req, res, next) => {
  try {
    if (req.usuario.tipoUsuario !== "empleado") {
      throw new AppError("Solo disponible para empleados", 403);
    }

    const { productoId, cantidad } = req.body;
    const { empleadorId, tipoEmpleador } = req.usuario;

    if (!productoId || !cantidad || cantidad <= 0) {
      throw new AppError("Producto y cantidad son requeridos", 400);
    }

    if (tipoEmpleador === "deposito") {
      // Agregar stock al depósito
      const producto = await Producto.findOne({
        where: {
          id: productoId,
          depositoId: empleadorId,
          activo: true,
        },
      });

      if (!producto) {
        throw new AppError("Producto no encontrado", 404);
      }

      // Incrementar stock
      const nuevoStock = producto.stock + cantidad;
      await producto.update({ stock: nuevoStock });

      return res.json({
        success: true,
        message: "Stock actualizado",
        data: {
          producto: producto.nombre,
          cantidadAgregada: cantidad,
          stockAnterior: producto.stock - cantidad,
          stockActual: nuevoStock,
        },
      });
    } else if (tipoEmpleador === "cliente") {
      // Agregar stock al cliente
      const stockItem = await StockCliente.findOne({
        where: {
          id: productoId,
          clienteId: empleadorId,
        },
      });

      if (!stockItem) {
        throw new AppError("Producto no encontrado en stock", 404);
      }

      // Incrementar cantidad
      const nuevaCantidad = stockItem.cantidad + cantidad;
      await stockItem.update({ cantidad: nuevaCantidad });

      return res.json({
        success: true,
        message: "Stock actualizado",
        data: {
          producto: stockItem.nombre,
          cantidadAgregada: cantidad,
          stockAnterior: stockItem.cantidad - cantidad,
          stockActual: nuevaCantidad,
        },
      });
    }

    throw new AppError("Tipo de empleador no válido", 400);
  } catch (error) {
    next(error);
  }
};

// POST /api/empleados/escaner/crear-producto - Crear nuevo producto (para empleados)
exports.crearProducto = async (req, res, next) => {
  try {
    if (req.usuario.tipoUsuario !== "empleado") {
      throw new AppError("Solo disponible para empleados", 403);
    }

    const { codigo, nombre, categoria, precio, precioVenta, cantidad } =
      req.body;
    const { empleadorId, tipoEmpleador } = req.usuario;

    if (!codigo || !nombre) {
      throw new AppError("Código y nombre son requeridos", 400);
    }

    if (tipoEmpleador === "deposito") {
      // Verificar si ya existe el producto con ese código
      const existente = await Producto.findOne({
        where: {
          codigo: codigo,
          depositoId: empleadorId,
        },
      });

      if (existente) {
        throw new AppError("Ya existe un producto con ese código", 400);
      }

      // Crear el producto
      const producto = await Producto.create({
        depositoId: empleadorId,
        codigo,
        nombre,
        categoria: categoria || "General",
        precio: precio || 0,
        stock: cantidad || 0,
        activo: true,
      });

      return res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          categoria: producto.categoria,
          precio: parseFloat(producto.precio || 0),
          precioVenta: parseFloat(producto.precio || 0),
          stock: producto.stock,
          tipo: "deposito",
        },
      });
    } else if (tipoEmpleador === "cliente") {
      // Verificar si ya existe el producto con ese código
      const existente = await StockCliente.findOne({
        where: {
          codigoBarras: codigo,
          clienteId: empleadorId,
        },
      });

      if (existente) {
        throw new AppError("Ya existe un producto con ese código", 400);
      }

      // Crear el producto en stock del cliente
      const stockItem = await StockCliente.create({
        clienteId: empleadorId,
        codigoBarras: codigo,
        nombre,
        categoria: categoria || "General",
        precio: precio || 0,
        precioVenta: precioVenta || precio || 0,
        cantidad: cantidad || 0,
      });

      return res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: {
          id: stockItem.id,
          codigo: stockItem.codigoBarras,
          nombre: stockItem.nombre,
          categoria: stockItem.categoria,
          precio: parseFloat(stockItem.precio || 0),
          precioVenta: parseFloat(
            stockItem.precioVenta || stockItem.precio || 0,
          ),
          stock: stockItem.cantidad,
          cantidad: stockItem.cantidad,
          tipo: "cliente",
        },
      });
    }

    throw new AppError("Tipo de empleador no válido", 400);
  } catch (error) {
    next(error);
  }
};

// ==================== ESTADÍSTICAS DE EMPLEADOS ====================

// GET /api/empleados/estadisticas - Obtener estadísticas de ventas de empleados
exports.getEstadisticasEmpleados = async (req, res, next) => {
  try {
    if (!["cliente", "deposito"].includes(req.usuario.tipoUsuario)) {
      throw new AppError("No autorizado", 403);
    }

    const { fechaDesde, fechaHasta } = req.query;

    // Obtener empleados del usuario
    const empleados = await Usuario.findAll({
      where: {
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
      attributes: ["id", "nombre", "email", "activo", "createdAt"],
    });

    // Construir filtro de fechas
    const whereMovimientos = {
      usuarioId: req.usuario.id,
      empleadoId: { [Op.ne]: null },
      categoria: "ventas",
    };

    if (fechaDesde || fechaHasta) {
      whereMovimientos.createdAt = {};
      if (fechaDesde) {
        whereMovimientos.createdAt[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereMovimientos.createdAt[Op.lte] = new Date(fechaHasta + "T23:59:59");
      }
    }

    // Obtener movimientos de ventas de empleados
    const movimientos = await Movimiento.findAll({
      where: whereMovimientos,
      attributes: ["id", "empleadoId", "monto", "concepto", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    // Agrupar estadísticas por empleado
    const estadisticasPorEmpleado = {};

    // Inicializar estadísticas para todos los empleados
    empleados.forEach((emp) => {
      estadisticasPorEmpleado[emp.id] = {
        empleado: {
          id: emp.id,
          nombre: emp.nombre,
          email: emp.email,
          activo: emp.activo,
        },
        totalVentas: 0,
        cantidadVentas: 0,
        ultimaVenta: null,
      };
    });

    // Calcular estadísticas de movimientos
    movimientos.forEach((mov) => {
      if (estadisticasPorEmpleado[mov.empleadoId]) {
        estadisticasPorEmpleado[mov.empleadoId].totalVentas += parseFloat(
          mov.monto,
        );
        estadisticasPorEmpleado[mov.empleadoId].cantidadVentas += 1;

        if (!estadisticasPorEmpleado[mov.empleadoId].ultimaVenta) {
          estadisticasPorEmpleado[mov.empleadoId].ultimaVenta = mov.createdAt;
        }
      }
    });

    // Convertir a array y ordenar por total de ventas
    const estadisticas = Object.values(estadisticasPorEmpleado).sort(
      (a, b) => b.totalVentas - a.totalVentas,
    );

    // Calcular totales generales
    const totalGeneral = estadisticas.reduce(
      (sum, e) => sum + e.totalVentas,
      0,
    );
    const totalTransacciones = estadisticas.reduce(
      (sum, e) => sum + e.cantidadVentas,
      0,
    );

    res.json({
      success: true,
      data: {
        empleados: estadisticas,
        resumen: {
          totalEmpleados: empleados.length,
          empleadosActivos: empleados.filter((e) => e.activo).length,
          totalVentas: totalGeneral,
          totalTransacciones,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/empleados/:id/estadisticas - Estadísticas de un empleado específico
exports.getEstadisticasEmpleado = async (req, res, next) => {
  try {
    if (!["cliente", "deposito"].includes(req.usuario.tipoUsuario)) {
      throw new AppError("No autorizado", 403);
    }

    const empleado = await Usuario.findOne({
      where: {
        id: req.params.id,
        empleadorId: req.usuario.id,
        tipoUsuario: "empleado",
      },
      attributes: ["id", "nombre", "email", "activo", "createdAt"],
    });

    if (!empleado) {
      throw new AppError("Empleado no encontrado", 404);
    }

    const { fechaDesde, fechaHasta } = req.query;

    // Construir filtro de fechas
    const whereMovimientos = {
      usuarioId: req.usuario.id,
      empleadoId: empleado.id,
      categoria: "ventas",
    };

    if (fechaDesde || fechaHasta) {
      whereMovimientos.createdAt = {};
      if (fechaDesde) {
        whereMovimientos.createdAt[Op.gte] = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereMovimientos.createdAt[Op.lte] = new Date(fechaHasta + "T23:59:59");
      }
    }

    // Obtener movimientos de ventas del empleado
    const movimientos = await Movimiento.findAll({
      where: whereMovimientos,
      attributes: ["id", "monto", "concepto", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    // Calcular estadísticas
    const totalVentas = movimientos.reduce(
      (sum, m) => sum + parseFloat(m.monto),
      0,
    );

    // Agrupar por día para gráfico
    const ventasPorDia = {};
    movimientos.forEach((mov) => {
      const fecha = new Date(mov.createdAt).toISOString().split("T")[0];
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = { total: 0, cantidad: 0 };
      }
      ventasPorDia[fecha].total += parseFloat(mov.monto);
      ventasPorDia[fecha].cantidad += 1;
    });

    res.json({
      success: true,
      data: {
        empleado: {
          id: empleado.id,
          nombre: empleado.nombre,
          email: empleado.email,
          activo: empleado.activo,
          fechaRegistro: empleado.createdAt,
        },
        estadisticas: {
          totalVentas,
          cantidadVentas: movimientos.length,
          promedioVenta:
            movimientos.length > 0 ? totalVentas / movimientos.length : 0,
        },
        ventasPorDia: Object.entries(ventasPorDia).map(([fecha, datos]) => ({
          fecha,
          ...datos,
        })),
        ultimasVentas: movimientos.slice(0, 10).map((m) => ({
          id: m.id,
          concepto: m.concepto,
          monto: parseFloat(m.monto),
          fecha: m.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
