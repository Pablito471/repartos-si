const { Producto, Usuario, Movimiento, CodigoAlternativo } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// GET /api/productos
exports.getProductos = async (req, res, next) => {
  try {
    const { depositoId, categoria, buscar, activo } = req.query;

    const where = {};

    if (depositoId) {
      where.depositoId = depositoId;
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (activo !== undefined) {
      where.activo = activo === "true";
    } else {
      where.activo = true;
    }

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${buscar}%` } },
        { codigo: { [Op.iLike]: `%${buscar}%` } },
      ];
    }

    const productos = await Producto.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["nombre", "ASC"]],
    });

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/productos/:id
exports.getProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre", "direccion"],
        },
      ],
    });

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/productos
exports.crearProducto = async (req, res, next) => {
  try {
    // Solo depósitos pueden crear productos
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const depositoId =
      req.usuario.tipoUsuario === "admin"
        ? req.body.depositoId
        : req.usuario.id;

    // Convertir nombre a mayúsculas
    const datosProducto = {
      ...req.body,
      depositoId,
      nombre: req.body.nombre
        ? req.body.nombre.trim().toUpperCase()
        : req.body.nombre,
    };

    const producto = await Producto.create(datosProducto);
    // Registrar movimiento contable de egreso (compra) si tiene costo y stock inicial
    // Usar costo en lugar de precio de venta para el egreso
    const costoProducto = producto.costo || producto.precio || 0;
    const stockInicial = producto.stock || 0;
    if (costoProducto > 0 && stockInicial > 0) {
      const montoCompra = costoProducto * stockInicial;
      await Movimiento.create({
        usuarioId: depositoId,
        tipo: "egreso",
        concepto: `Compra inicial: ${stockInicial}x ${producto.nombre}`,
        monto: montoCompra,
        categoria: "compras",
        notas: `Producto agregado al inventario`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Producto creado",
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/productos/:id
exports.actualizarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Convertir nombre a mayúsculas si se está actualizando
    const datosActualizados = { ...req.body };
    if (datosActualizados.nombre) {
      datosActualizados.nombre = datosActualizados.nombre.trim().toUpperCase();
    }

    await producto.update(datosActualizados);

    res.json({
      success: true,
      message: "Producto actualizado",
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/productos/:id
exports.eliminarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Soft delete
    await producto.update({ activo: false });

    res.json({
      success: true,
      message: "Producto eliminado",
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/productos/:id/stock
exports.actualizarStock = async (req, res, next) => {
  try {
    const { cantidad, tipo } = req.body; // tipo: 'agregar' | 'restar' | 'establecer'
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    let nuevoStock;
    switch (tipo) {
      case "agregar":
        nuevoStock = producto.stock + cantidad;
        break;
      case "restar":
        nuevoStock = Math.max(0, producto.stock - cantidad);
        break;
      case "establecer":
      default:
        nuevoStock = cantidad;
    }

    await producto.update({ stock: nuevoStock });

    res.json({
      success: true,
      message: "Stock actualizado",
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/productos/deposito/:depositoId
exports.getProductosPorDeposito = async (req, res, next) => {
  try {
    const productos = await Producto.findAll({
      where: {
        depositoId: req.params.depositoId,
        activo: true,
      },
      order: [
        ["categoria", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/productos/:id/reactivar - Reactivar producto (deshacer borrado lógico)
exports.reactivarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    if (producto.activo) {
      throw new AppError("El producto ya está activo", 400);
    }

    await producto.update({ activo: true });

    res.json({
      success: true,
      message: "Producto reactivado",
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/productos/:id/permanente - Eliminar producto permanentemente
exports.eliminarPermanente = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    // Eliminar permanentemente
    await producto.destroy();

    res.json({
      success: true,
      message: "Producto eliminado permanentemente",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/productos/inactivos - Obtener productos inactivos del depósito
exports.getProductosInactivos = async (req, res, next) => {
  try {
    const where = { activo: false };

    // Si no es admin, solo ver los propios
    if (req.usuario.tipoUsuario !== "admin") {
      where.depositoId = req.usuario.id;
    }

    const productos = await Producto.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/productos/buscar-codigo/:codigo - Buscar producto por código de barras
exports.buscarPorCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    // Solo depósitos pueden usar este endpoint
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const depositoId =
      req.usuario.tipoUsuario === "admin"
        ? req.query.depositoId
        : req.usuario.id;
    if (!depositoId) {
      throw new AppError("Se requiere depositoId", 400);
    }

    // 1. Buscar producto por código principal
    let producto = await Producto.findOne({
      where: {
        depositoId,
        activo: true,
        [Op.or]: [{ codigo: codigo }, { codigo: { [Op.iLike]: codigo } }],
      },
    });

    // 2. Si no lo encuentra, buscar en códigos alternativos
    let esCodigoAlternativo = false;
    if (!producto) {
      const codigoAlt = await CodigoAlternativo.findOne({
        where: {
          depositoId,
          activo: true,
          [Op.or]: [{ codigo: codigo }, { codigo: { [Op.iLike]: codigo } }],
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
        producto = codigoAlt.producto;
        esCodigoAlternativo = true;
      }
    }

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: parseFloat(producto.precio),
        costo: producto.costo ? parseFloat(producto.costo) : null,
        stock: producto.stock,
        stockMinimo: producto.stockMinimo,
        stockMaximo: producto.stockMaximo,
        ubicacion: producto.ubicacion,
        imagen: producto.imagen,
        esGranel: producto.esGranel,
        unidadMedida: producto.unidadMedida,
        precioUnidad: producto.precioUnidad ? parseFloat(producto.precioUnidad) : null,
        esCodigoAlternativo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/productos/movimiento-stock/:id - Registrar movimiento de stock
exports.registrarMovimientoStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cantidad, tipo, motivo } = req.body;

    // Solo depósitos pueden usar este endpoint
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const producto = await Producto.findByPk(id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    const cantidadNum = parseInt(cantidad);
    const stockAnterior = producto.stock;
    let nuevoStock;

    if (tipo === "entrada") {
      nuevoStock = stockAnterior + cantidadNum;
    } else if (tipo === "salida") {
      if (stockAnterior < cantidadNum) {
        throw new AppError(
          `Stock insuficiente. Disponible: ${stockAnterior}`,
          400,
        );
      }
      nuevoStock = stockAnterior - cantidadNum;
    } else {
      throw new AppError("Tipo de movimiento inválido", 400);
    }

    await producto.update({ stock: nuevoStock });

    // Registrar movimiento contable
    const precioProducto = producto.precio || producto.precioCosto || 0;
    if (precioProducto > 0) {
      const montoMovimiento = precioProducto * cantidadNum;
      if (tipo === "entrada") {
        // Entrada = compra = egreso
        await Movimiento.create({
          usuarioId: producto.depositoId,
          tipo: "egreso",
          concepto: `Compra: ${cantidadNum}x ${producto.nombre}`,
          monto: montoMovimiento,
          categoria: "compras",
          notas: motivo || "Entrada de stock",
        });
      } else if (tipo === "salida") {
        // Salida = venta = ingreso
        const precioVenta = producto.precioVenta || producto.precio || 0;
        const montoVenta = precioVenta * cantidadNum;
        if (montoVenta > 0) {
          await Movimiento.create({
            usuarioId: producto.depositoId,
            tipo: "ingreso",
            concepto: `Venta: ${cantidadNum}x ${producto.nombre}`,
            monto: montoVenta,
            categoria: "ventas",
            notas: motivo || "Salida de stock",
          });
        }
      }
    }

    res.json({
      success: true,
      message: `${tipo === "entrada" ? "Entrada" : "Salida"} registrada`,
      data: {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        stockAnterior: stockAnterior,
        cantidad: cantidadNum,
        tipo,
        motivo,
        stockActual: nuevoStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/productos/:id/codigos-alternativos - Agregar código alternativo a producto
exports.agregarCodigoAlternativo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { codigo, agregarStock, cantidad } = req.body;

    // Solo depósitos pueden usar este endpoint
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const producto = await Producto.findByPk(id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    const depositoId = producto.depositoId;

    // Verificar que el código no exista ya (ni como producto ni como código alternativo)
    const productoExistente = await Producto.findOne({
      where: {
        depositoId,
        codigo: codigo,
        activo: true,
      },
    });

    if (productoExistente) {
      throw new AppError(
        `El código "${codigo}" ya existe como producto principal: ${productoExistente.nombre}`,
        400,
      );
    }

    const codigoAltExistente = await CodigoAlternativo.findOne({
      where: {
        depositoId,
        codigo: codigo,
        activo: true,
      },
    });

    if (codigoAltExistente) {
      throw new AppError(
        `El código "${codigo}" ya está asociado a otro producto`,
        400,
      );
    }

    // Crear código alternativo
    const nuevoCodigoAlt = await CodigoAlternativo.create({
      productoId: producto.id,
      codigo: codigo,
      depositoId: depositoId,
    });

    // Si se pidió agregar stock, hacerlo
    let stockAgregado = 0;
    if (agregarStock && cantidad && parseInt(cantidad) > 0) {
      const cantidadNum = parseInt(cantidad);
      const stockAnterior = producto.stock;
      const nuevoStock = stockAnterior + cantidadNum;
      await producto.update({ stock: nuevoStock });
      stockAgregado = cantidadNum;

      // Registrar movimiento contable
      const costoProducto = producto.costo || producto.precio || 0;
      if (costoProducto > 0) {
        const montoCompra = costoProducto * cantidadNum;
        await Movimiento.create({
          usuarioId: depositoId,
          tipo: "egreso",
          concepto: `Compra: ${cantidadNum}x ${producto.nombre} (código alt: ${codigo})`,
          monto: montoCompra,
          categoria: "compras",
          notas: "Entrada por código alternativo",
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Código alternativo "${codigo}" asociado a ${producto.nombre}${stockAgregado > 0 ? ` (+${stockAgregado} unidades)` : ""}`,
      data: {
        codigoAlternativo: nuevoCodigoAlt,
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          stock: producto.stock,
        },
        stockAgregado,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/productos/:id/codigos-alternativos - Obtener códigos alternativos de un producto
exports.getCodigosAlternativos = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Solo depósitos pueden usar este endpoint
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const producto = await Producto.findByPk(id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    const codigosAlternativos = await CodigoAlternativo.findAll({
      where: {
        productoId: id,
        activo: true,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: codigosAlternativos,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/productos/:id/codigos-alternativos/:codigoId - Eliminar código alternativo
exports.eliminarCodigoAlternativo = async (req, res, next) => {
  try {
    const { id, codigoId } = req.params;

    // Solo depósitos pueden usar este endpoint
    if (
      req.usuario.tipoUsuario !== "deposito" &&
      req.usuario.tipoUsuario !== "admin"
    ) {
      throw new AppError("No autorizado", 403);
    }

    const producto = await Producto.findByPk(id);

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Verificar permisos
    if (
      req.usuario.tipoUsuario !== "admin" &&
      producto.depositoId !== req.usuario.id
    ) {
      throw new AppError("No autorizado", 403);
    }

    const codigoAlt = await CodigoAlternativo.findOne({
      where: {
        id: codigoId,
        productoId: id,
      },
    });

    if (!codigoAlt) {
      throw new AppError("Código alternativo no encontrado", 404);
    }

    // Soft delete
    await codigoAlt.update({ activo: false });

    res.json({
      success: true,
      message: `Código alternativo "${codigoAlt.codigo}" eliminado`,
    });
  } catch (error) {
    next(error);
  }
};
