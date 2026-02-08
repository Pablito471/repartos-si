const { Producto, ProductoRelacion, Usuario } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// POST /api/consolidacion/relacionar - Relacionar dos productos por sus códigos de barras
exports.relacionarProductos = async (req, res, next) => {
  try {
    const {
      codigoBarras1,
      codigoBarras2,
      productoPrincipalId,
      productoRelacionadoId,
    } = req.body;

    // Solo depósitos pueden usar este endpoint
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

    if (!depositoId) {
      throw new AppError("Se requiere depositoId", 400);
    }

    let producto1, producto2;

    // Buscar productos por código de barras o por ID
    if (codigoBarras1) {
      producto1 = await Producto.findOne({
        where: {
          depositoId,
          activo: true,
          [Op.or]: [
            { codigo: codigoBarras1 },
            { codigo: { [Op.iLike]: codigoBarras1 } },
          ],
        },
      });
    } else if (productoPrincipalId) {
      producto1 = await Producto.findOne({
        where: { id: productoPrincipalId, depositoId, activo: true },
      });
    } else {
      throw new AppError(
        "Se requiere codigoBarras1 o productoPrincipalId",
        400,
      );
    }

    if (codigoBarras2) {
      producto2 = await Producto.findOne({
        where: {
          depositoId,
          activo: true,
          [Op.or]: [
            { codigo: codigoBarras2 },
            { codigo: { [Op.iLike]: codigoBarras2 } },
          ],
        },
      });
    } else if (productoRelacionadoId) {
      producto2 = await Producto.findOne({
        where: { id: productoRelacionadoId, depositoId, activo: true },
      });
    } else {
      throw new AppError(
        "Se requiere codigoBarras2 o productoRelacionadoId",
        400,
      );
    }

    if (!producto1) {
      throw new AppError("No se encontró el primer producto", 404);
    }

    if (!producto2) {
      throw new AppError("No se encontró el segundo producto", 404);
    }

    if (producto1.id === producto2.id) {
      throw new AppError(
        "No se puede relacionar un producto consigo mismo",
        400,
      );
    }

    // Verificar si ya existe una relación
    const relacionExistente = await ProductoRelacion.findOne({
      where: {
        [Op.or]: [
          {
            productoPrincipalId: producto1.id,
            productoRelacionadoId: producto2.id,
          },
          {
            productoPrincipalId: producto2.id,
            productoRelacionadoId: producto1.id,
          },
        ],
        activo: true,
      },
    });

    if (relacionExistente) {
      throw new AppError("Estos productos ya están relacionados", 400);
    }

    // Crear la relación
    const relacion = await ProductoRelacion.create({
      productoPrincipalId: producto1.id,
      productoRelacionadoId: producto2.id,
      depositoId,
    });

    res.status(201).json({
      success: true,
      message: "Productos relacionados correctamente",
      data: {
        relacion,
        productoPrincipal: {
          id: producto1.id,
          codigo: producto1.codigo,
          nombre: producto1.nombre,
          stock: producto1.stock,
        },
        productoRelacionado: {
          id: producto2.id,
          codigo: producto2.codigo,
          nombre: producto2.nombre,
          stock: producto2.stock,
        },
        stockTotal: parseInt(producto1.stock) + parseInt(producto2.stock),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/consolidacion/productos/:productoId - Obtener producto con stock consolidado
exports.getProductoConsolidado = async (req, res, next) => {
  try {
    const { productoId } = req.params;

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

    const producto = await Producto.findOne({
      where: { id: productoId, depositoId, activo: true },
    });

    if (!producto) {
      throw new AppError("Producto no encontrado", 404);
    }

    // Buscar productos relacionados
    const relaciones = await ProductoRelacion.findAll({
      where: {
        [Op.or]: [
          { productoPrincipalId: productoId },
          { productoRelacionadoId: productoId },
        ],
        depositoId,
        activo: true,
      },
      include: [
        {
          model: Producto,
          as: "productoPrincipal",
          attributes: ["id", "codigo", "nombre", "stock"],
        },
        {
          model: Producto,
          as: "productoRelacionado",
          attributes: ["id", "codigo", "nombre", "stock"],
        },
      ],
    });

    // Calcular stock total consolidado
    let stockTotal = parseInt(producto.stock);
    const productosRelacionados = [];

    for (const relacion of relaciones) {
      const esPrincipal = relacion.productoPrincipalId === productoId;
      const productoRelacionado = esPrincipal
        ? relacion.productoRelacionado
        : relacion.productoPrincipal;

      if (productoRelacionado) {
        stockTotal += parseInt(productoRelacionado.stock);
        productosRelacionados.push({
          id: productoRelacionado.id,
          codigo: productoRelacionado.codigo,
          nombre: productoRelacionado.nombre,
          stock: productoRelacionado.stock,
          relacionId: relacion.id,
          esPrincipal,
        });
      }
    }

    res.json({
      success: true,
      data: {
        producto: {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          stock: producto.stock,
          stockConsolidado: stockTotal,
          precio: producto.precio,
          costo: producto.costo,
          categoria: producto.categoria,
        },
        productosRelacionados,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/consolidacion/consolidar - Consolidar stock de productos relacionados
exports.consolidarStock = async (req, res, next) => {
  try {
    const { productoId, moverTodo = false } = req.body;

    // Solo depósitos pueden usar este endpoint
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

    if (!depositoId) {
      throw new AppError("Se requiere depositoId", 400);
    }

    const productoPrincipal = await Producto.findOne({
      where: { id: productoId, depositoId, activo: true },
    });

    if (!productoPrincipal) {
      throw new AppError("Producto principal no encontrado", 404);
    }

    // Buscar productos relacionados
    const relaciones = await ProductoRelacion.findAll({
      where: {
        [Op.or]: [
          { productoPrincipalId: productoId },
          { productoRelacionadoId: productoId },
        ],
        depositoId,
        activo: true,
      },
    });

    let stockTotal = parseInt(productoPrincipal.stock);
    const productosMovidos = [];

    for (const relacion of relaciones) {
      const productoRelacionadoId =
        relacion.productoPrincipalId === productoId
          ? relacion.productoRelacionadoId
          : relacion.productoPrincipalId;

      const productoRelacionado = await Producto.findOne({
        where: { id: productoRelacionadoId, depositoId, activo: true },
      });

      if (productoRelacionado && parseInt(productoRelacionado.stock) > 0) {
        stockTotal += parseInt(productoRelacionado.stock);
        productosMovidos.push({
          id: productoRelacionado.id,
          codigo: productoRelacionado.codigo,
          nombre: productoRelacionado.nombre,
          stockAnterior: productoRelacionado.stock,
        });

        // Si moverTodo es true, desactivar el producto relacionado
        if (moverTodo) {
          await productoRelacionado.update({ activo: false });
          // También desactivar la relación
          await relacion.update({ activo: false });
        }
      }
    }

    // Actualizar el stock del producto principal
    await productoPrincipal.update({ stock: stockTotal });

    res.json({
      success: true,
      message: `Stock consolidado. Total: ${stockTotal} unidades`,
      data: {
        productoPrincipal: {
          id: productoPrincipal.id,
          codigo: productoPrincipal.codigo,
          nombre: productoPrincipal.nombre,
          stockAnterior:
            req.body.stockAnterior ||
            parseInt(productoPrincipal.stock) -
              productosMovidos.reduce((sum, p) => sum + p.stockAnterior, 0),
          stockNuevo: stockTotal,
        },
        productosRelacionados: productosMovidos,
        totalMovido: productosMovidos.reduce(
          (sum, p) => sum + p.stockAnterior,
          0,
        ),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/consolidacion/agregar-stock - Agregar stock de un producto con nuevo código de barras
exports.agregarStockConsolidado = async (req, res, next) => {
  try {
    const {
      codigoBarrasExistente,
      codigoBarrasNuevo,
      cantidad,
      productoExistenteId,
      productoNuevoId,
    } = req.body;

    // Solo depósitos pueden usar este endpoint
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

    if (!depositoId) {
      throw new AppError("Se requiere depositoId", 400);
    }

    // Buscar producto existente
    let productoExistente;
    if (codigoBarrasExistente) {
      productoExistente = await Producto.findOne({
        where: {
          depositoId,
          activo: true,
          [Op.or]: [
            { codigo: codigoBarrasExistente },
            { codigo: { [Op.iLike]: codigoBarrasExistente } },
          ],
        },
      });
    } else if (productoExistenteId) {
      productoExistente = await Producto.findOne({
        where: { id: productoExistenteId, depositoId, activo: true },
      });
    } else {
      throw new AppError(
        "Se requiere codigoBarrasExistente o productoExistenteId",
        400,
      );
    }

    if (!productoExistente) {
      throw new AppError("No se encontró el producto existente", 404);
    }

    // Buscar o crear el producto con el nuevo código de barras
    let productoNuevo;
    if (codigoBarrasNuevo) {
      productoNuevo = await Producto.findOne({
        where: {
          depositoId,
          [Op.or]: [
            { codigo: codigoBarrasNuevo },
            { codigo: { [Op.iLike]: codigoBarrasNuevo } },
          ],
        },
      });

      // Si no existe, crear un nuevo registro
      if (!productoNuevo) {
        productoNuevo = await Producto.create({
          depositoId,
          codigo: codigoBarrasNuevo,
          nombre: productoExistente.nombre,
          descripcion: productoExistente.descripcion,
          categoria: productoExistente.categoria,
          precio: productoExistente.precio,
          costo: productoExistente.costo,
          stockMinimo: productoExistente.stockMinimo,
          stockMaximo: productoExistente.stockMaximo,
          ubicacion: productoExistente.ubicacion,
          imagen: productoExistente.imagen,
          stock: 0,
        });
      }
    } else if (productoNuevoId) {
      productoNuevo = await Producto.findOne({
        where: { id: productoNuevoId, depositoId },
      });
    }

    if (!productoNuevo) {
      throw new AppError("No se encontró el nuevo producto", 404);
    }

    // Si son el mismo producto, solo agregar stock
    if (productoExistente.id === productoNuevo.id) {
      const nuevoStock = parseInt(productoExistente.stock) + parseInt(cantidad);
      await productoExistente.update({ stock: nuevoStock });

      return res.json({
        success: true,
        message: `Stock actualizado. Total: ${nuevoStock} unidades`,
        data: {
          producto: {
            id: productoExistente.id,
            codigo: productoExistente.codigo,
            nombre: productoExistente.nombre,
            stock: nuevoStock,
          },
        },
      });
    }

    // Agregar stock al nuevo producto
    const stockNuevoProducto =
      parseInt(productoNuevo.stock || 0) + parseInt(cantidad);
    await productoNuevo.update({ stock: stockNuevoProducto });

    // Crear relación entre los productos
    const relacionExistente = await ProductoRelacion.findOne({
      where: {
        [Op.or]: [
          {
            productoPrincipalId: productoExistente.id,
            productoRelacionadoId: productoNuevo.id,
          },
          {
            productoPrincipalId: productoNuevo.id,
            productoRelacionadoId: productoExistente.id,
          },
        ],
        depositoId,
        activo: true,
      },
    });

    if (!relacionExistente) {
      await ProductoRelacion.create({
        productoPrincipalId: productoExistente.id,
        productoRelacionadoId: productoNuevo.id,
        depositoId,
      });
    }

    // Calcular stock consolidado total
    const stockConsolidado =
      parseInt(productoExistente.stock) + stockNuevoProducto;

    res.json({
      success: true,
      message: `Stock agregado y productos relacionados. Stock consolidado: ${stockConsolidado} unidades`,
      data: {
        productoExistente: {
          id: productoExistente.id,
          codigo: productoExistente.codigo,
          nombre: productoExistente.nombre,
          stock: productoExistente.stock,
        },
        productoNuevo: {
          id: productoNuevo.id,
          codigo: productoNuevo.codigo,
          nombre: productoNuevo.nombre,
          stock: stockNuevoProducto,
        },
        stockConsolidado,
        relacionCreada: !relacionExistente,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/consolidacion/relaciones - Obtener todas las relaciones de productos
exports.getRelaciones = async (req, res, next) => {
  try {
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

    const relaciones = await ProductoRelacion.findAll({
      where: { depositoId, activo: true },
      include: [
        {
          model: Producto,
          as: "productoPrincipal",
          attributes: ["id", "codigo", "nombre", "stock"],
        },
        {
          model: Producto,
          as: "productoRelacionado",
          attributes: ["id", "codigo", "nombre", "stock"],
        },
        {
          model: Usuario,
          as: "deposito",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calcular stock consolidado para cada relación
    const relacionesConStock = relaciones.map((rel) => {
      const stockPrincipal = parseInt(rel.productoPrincipal?.stock || 0);
      const stockRelacionado = parseInt(rel.productoRelacionado?.stock || 0);
      return {
        id: rel.id,
        stockConsolidado: stockPrincipal + stockRelacionado,
        productoPrincipal: rel.productoPrincipal,
        productoRelacionado: rel.productoRelacionado,
        deposito: rel.deposito,
        createdAt: rel.createdAt,
      };
    });

    res.json({
      success: true,
      data: relacionesConStock,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/consolidacion/relaciones/:id - Eliminar una relación
exports.eliminarRelacion = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    const relacion = await ProductoRelacion.findOne({
      where: { id, depositoId },
    });

    if (!relacion) {
      throw new AppError("Relación no encontrada", 404);
    }

    await relacion.update({ activo: false });

    res.json({
      success: true,
      message: "Relación eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
