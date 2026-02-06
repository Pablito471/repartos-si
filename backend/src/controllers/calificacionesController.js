const {
  Calificacion,
  Usuario,
  Pedido,
  Envio,
  sequelize,
} = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// Función para validar UUID
const isValidUUID = (str) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// GET /api/calificaciones
exports.getCalificaciones = async (req, res, next) => {
  try {
    const { usuarioId, tipo } = req.query;

    const where = {};
    if (usuarioId) {
      if (!isValidUUID(usuarioId)) {
        throw new AppError("ID de usuario inválido", 400);
      }
      where.calificadoId = usuarioId;
    }

    const calificaciones = await Calificacion.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: "calificador",
          attributes: ["id", "nombre", "tipoUsuario"],
        },
        {
          model: Usuario,
          as: "calificado",
          attributes: ["id", "nombre", "tipoUsuario"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: calificaciones,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/calificaciones/usuario/:id
exports.getCalificacionesUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar que sea un UUID válido
    if (!isValidUUID(id)) {
      return res.json({
        success: true,
        data: {
          calificaciones: [],
          promedio: null,
          total: 0,
        },
      });
    }

    const calificaciones = await Calificacion.findAll({
      where: { calificadoId: id },
      include: [
        {
          model: Usuario,
          as: "calificador",
          attributes: ["id", "nombre", "tipoUsuario"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calcular promedio
    const promedio = await Calificacion.findOne({
      where: { calificadoId: id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        calificaciones,
        promedio: promedio?.promedio
          ? parseFloat(promedio.promedio).toFixed(1)
          : null,
        total: promedio?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/calificaciones
exports.crearCalificacion = async (req, res, next) => {
  try {
    const { calificadoId, pedidoId, puntuacion, comentario } = req.body;

    // Validar UUID de calificadoId
    if (!calificadoId || !isValidUUID(calificadoId)) {
      throw new AppError("ID de usuario a calificar inválido", 400);
    }

    // Validar UUID de pedidoId si se proporciona
    if (pedidoId && !isValidUUID(pedidoId)) {
      throw new AppError("ID de pedido inválido", 400);
    }

    // No puede calificarse a sí mismo
    if (calificadoId === req.usuario.id) {
      throw new AppError("No puedes calificarte a ti mismo", 400);
    }

    // Verificar que el usuario a calificar existe
    const usuarioCalificado = await Usuario.findByPk(calificadoId);
    if (!usuarioCalificado) {
      throw new AppError("Usuario a calificar no encontrado", 404);
    }

    // Verificar si ya calificó a este usuario por este pedido
    if (pedidoId) {
      const calificacionExistente = await Calificacion.findOne({
        where: {
          calificadorId: req.usuario.id,
          calificadoId,
          pedidoId,
        },
      });

      if (calificacionExistente) {
        throw new AppError(
          "Ya calificaste a este usuario por este pedido",
          400,
        );
      }
    }

    const calificacion = await Calificacion.create({
      calificadorId: req.usuario.id,
      calificadoId,
      pedidoId,
      puntuacion,
      comentario,
    });

    const calificacionCompleta = await Calificacion.findByPk(calificacion.id, {
      include: [
        {
          model: Usuario,
          as: "calificador",
          attributes: ["id", "nombre", "tipoUsuario"],
        },
        {
          model: Usuario,
          as: "calificado",
          attributes: ["id", "nombre", "tipoUsuario"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Calificación registrada",
      data: calificacionCompleta,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/calificaciones/promedio/:usuarioId
exports.getPromedioUsuario = async (req, res, next) => {
  try {
    const { usuarioId } = req.params;

    // Validar que sea un UUID válido
    if (!isValidUUID(usuarioId)) {
      return res.json({
        success: true,
        data: {
          promedio: null,
          total: 0,
        },
      });
    }

    const resultado = await Calificacion.findOne({
      where: { calificadoId: usuarioId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total"],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        promedio: resultado?.promedio
          ? parseFloat(resultado.promedio).toFixed(1)
          : null,
        total: resultado?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/calificaciones/estadisticas - Para admin
exports.getEstadisticas = async (req, res, next) => {
  try {
    // Obtener todos los usuarios no admin con sus calificaciones
    const usuarios = await Usuario.findAll({
      where: {
        tipoUsuario: { [require("sequelize").Op.ne]: "admin" },
        esOculto: false,
      },
      attributes: ["id", "nombre", "tipoUsuario", "foto", "createdAt"],
      include: [
        {
          model: Calificacion,
          as: "calificacionesRecibidas",
          include: [
            {
              model: Usuario,
              as: "calificador",
              attributes: ["id", "nombre", "tipoUsuario"],
            },
          ],
        },
      ],
    });

    // Construir ranking
    const ranking = usuarios
      .map((u) => {
        const calificaciones = u.calificacionesRecibidas || [];
        const promedio =
          calificaciones.length > 0
            ? calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
              calificaciones.length
            : 0;
        return {
          id: u.id,
          nombre: u.nombre,
          tipo: u.tipoUsuario,
          foto: u.foto,
          fechaRegistro: u.createdAt,
          calificaciones: calificaciones.map((c) => ({
            id: c.id,
            puntuacion: c.puntuacion,
            comentario: c.comentario,
            fecha: c.createdAt,
            calificador: c.calificador,
          })),
          promedio: parseFloat(promedio.toFixed(1)),
          totalCalificaciones: calificaciones.length,
        };
      })
      .filter((u) => u.totalCalificaciones > 0)
      .sort((a, b) => b.promedio - a.promedio);

    // Estadísticas por tipo
    const statsPorTipo = ["cliente", "deposito", "flete"].map((tipo) => {
      const usuariosTipo = usuarios.filter((u) => u.tipoUsuario === tipo);
      const conCalificaciones = usuariosTipo.filter(
        (u) => u.calificacionesRecibidas?.length > 0,
      );
      const todasCalificaciones = conCalificaciones.flatMap(
        (u) => u.calificacionesRecibidas || [],
      );

      return {
        tipo,
        totalUsuarios: usuariosTipo.length,
        usuariosConCalificaciones: conCalificaciones.length,
        totalCalificaciones: todasCalificaciones.length,
        promedioGeneral:
          todasCalificaciones.length > 0
            ? parseFloat(
                (
                  todasCalificaciones.reduce(
                    (acc, c) => acc + c.puntuacion,
                    0,
                  ) / todasCalificaciones.length
                ).toFixed(1),
              )
            : 0,
      };
    });

    // Total global
    const todasLasCalificaciones = usuarios.flatMap(
      (u) => u.calificacionesRecibidas || [],
    );

    res.json({
      success: true,
      data: {
        ranking,
        statsPorTipo,
        totalCalificaciones: todasLasCalificaciones.length,
        promedioGlobal:
          todasLasCalificaciones.length > 0
            ? parseFloat(
                (
                  todasLasCalificaciones.reduce(
                    (acc, c) => acc + c.puntuacion,
                    0,
                  ) / todasLasCalificaciones.length
                ).toFixed(1),
              )
            : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/calificaciones/pendientes - Obtener pedidos/usuarios pendientes de calificar
exports.getPendientesCalificar = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    const tipoUsuario = req.usuario.tipoUsuario;

    // Buscar pedidos entregados donde el usuario participó
    let pedidosEntregados;

    if (tipoUsuario === "cliente") {
      pedidosEntregados = await Pedido.findAll({
        where: { estado: "entregado", clienteId: usuarioId },
        include: [
          {
            model: Usuario,
            as: "cliente",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Usuario,
            as: "deposito",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Envio,
            as: "envio",
            required: false,
            include: [
              {
                model: Usuario,
                as: "flete",
                attributes: ["id", "nombre", "tipoUsuario", "foto"],
                required: false,
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
        limit: 50,
      });
    } else if (tipoUsuario === "deposito") {
      pedidosEntregados = await Pedido.findAll({
        where: { estado: "entregado", depositoId: usuarioId },
        include: [
          {
            model: Usuario,
            as: "cliente",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Usuario,
            as: "deposito",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Envio,
            as: "envio",
            required: false,
            include: [
              {
                model: Usuario,
                as: "flete",
                attributes: ["id", "nombre", "tipoUsuario", "foto"],
                required: false,
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
        limit: 50,
      });
    } else if (tipoUsuario === "flete") {
      // Para flete, buscar a través de la tabla Envio
      const envios = await Envio.findAll({
        where: { fleteId: usuarioId },
        attributes: ["pedidoId"],
      });
      const pedidoIds = envios.map((e) => e.pedidoId);

      pedidosEntregados = await Pedido.findAll({
        where: { estado: "entregado", id: { [Op.in]: pedidoIds } },
        include: [
          {
            model: Usuario,
            as: "cliente",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Usuario,
            as: "deposito",
            attributes: ["id", "nombre", "tipoUsuario", "foto"],
          },
          {
            model: Envio,
            as: "envio",
            required: false,
            include: [
              {
                model: Usuario,
                as: "flete",
                attributes: ["id", "nombre", "tipoUsuario", "foto"],
                required: false,
              },
            ],
          },
        ],
        order: [["updatedAt", "DESC"]],
        limit: 50,
      });
    } else {
      pedidosEntregados = [];
    }

    // Obtener las calificaciones ya hechas por este usuario
    const calificacionesHechas = await Calificacion.findAll({
      where: { calificadorId: usuarioId },
      attributes: ["calificadoId", "pedidoId"],
    });

    const calificacionesMap = new Set(
      calificacionesHechas.map(
        (c) => `${c.calificadoId}-${c.pedidoId || "general"}`,
      ),
    );

    // Filtrar pedidos y usuarios pendientes de calificar
    const pendientes = [];

    for (const pedido of pedidosEntregados) {
      const participantes = [];

      // Agregar cliente si no es el usuario actual
      if (pedido.cliente && pedido.cliente.id !== usuarioId) {
        const key = `${pedido.cliente.id}-${pedido.id}`;
        if (!calificacionesMap.has(key)) {
          participantes.push({
            usuario: pedido.cliente,
            rol: "cliente",
          });
        }
      }

      // Agregar depósito si no es el usuario actual
      if (pedido.deposito && pedido.deposito.id !== usuarioId) {
        const key = `${pedido.deposito.id}-${pedido.id}`;
        if (!calificacionesMap.has(key)) {
          participantes.push({
            usuario: pedido.deposito,
            rol: "deposito",
          });
        }
      }

      // Agregar flete si existe y no es el usuario actual
      const flete = pedido.envio?.flete;
      if (flete && flete.id !== usuarioId) {
        const key = `${flete.id}-${pedido.id}`;
        if (!calificacionesMap.has(key)) {
          participantes.push({
            usuario: flete,
            rol: "flete",
          });
        }
      }

      if (participantes.length > 0) {
        pendientes.push({
          pedidoId: pedido.id,
          numeroPedido: pedido.numero,
          fechaEntrega: pedido.updatedAt,
          participantes,
        });
      }
    }

    res.json({
      success: true,
      data: {
        pendientes,
        total: pendientes.reduce((acc, p) => acc + p.participantes.length, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
