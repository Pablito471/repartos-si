const { Calificacion, Usuario, sequelize } = require("../models");
const { AppError } = require("../middleware/errorHandler");

// GET /api/calificaciones
exports.getCalificaciones = async (req, res, next) => {
  try {
    const { usuarioId, tipo } = req.query;

    const where = {};
    if (usuarioId) {
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
    const calificaciones = await Calificacion.findAll({
      where: { calificadoId: req.params.id },
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
      where: { calificadoId: req.params.id },
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
    const resultado = await Calificacion.findOne({
      where: { calificadoId: req.params.usuarioId },
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
