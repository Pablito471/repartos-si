const { Usuario, Calificacion, sequelize } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const { Op } = require("sequelize");
const {
  enviarEmailCuentaDesactivada,
  enviarEmailCuentaActivada,
} = require("../services/emailService");

// GET /api/usuarios
exports.getUsuarios = async (req, res, next) => {
  try {
    const { tipoUsuario, activo, buscar } = req.query;

    const where = { esOculto: false };

    if (tipoUsuario) {
      where.tipoUsuario = tipoUsuario;
    }

    if (activo !== undefined) {
      where.activo = activo === "true";
    }

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${buscar}%` } },
        { email: { [Op.iLike]: `%${buscar}%` } },
      ];
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/usuarios/:id
exports.getUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
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

    if (!usuario) {
      throw new AppError("Usuario no encontrado", 404);
    }

    // Calcular promedio de calificaciones
    const promedio = await Calificacion.findOne({
      where: { calificadoId: usuario.id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        ...usuario.toJSON(),
        promedioCalificacion: promedio?.promedio
          ? parseFloat(promedio.promedio).toFixed(1)
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/usuarios/:id
exports.actualizarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      throw new AppError("Usuario no encontrado", 404);
    }

    // Solo admin puede cambiar tipo de usuario o estado activo
    if (req.usuario.tipoUsuario !== "admin") {
      delete req.body.tipoUsuario;
      delete req.body.activo;
      delete req.body.esOculto;
    }

    await usuario.update(req.body);

    res.json({
      success: true,
      message: "Usuario actualizado",
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/usuarios/:id/activar
exports.activarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      throw new AppError("Usuario no encontrado", 404);
    }

    await usuario.update({ activo: true });

    // Enviar email de notificación
    enviarEmailCuentaActivada(usuario).catch((err) => {
      console.error("Error enviando email de activación:", err);
    });

    res.json({
      success: true,
      message: "Usuario activado",
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/usuarios/:id/desactivar
exports.desactivarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const { motivo } = req.body;

    await usuario.update({ activo: false });

    // Enviar email de notificación
    enviarEmailCuentaDesactivada(usuario, motivo).catch((err) => {
      console.error("Error enviando email de desactivación:", err);
    });

    res.json({
      success: true,
      message: "Usuario desactivado",
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/usuarios/depositos (público - lista de depósitos disponibles)
exports.getDepositos = async (req, res, next) => {
  try {
    const depositos = await Usuario.findAll({
      where: {
        tipoUsuario: "deposito",
        activo: true,
        esOculto: false,
      },
      attributes: [
        "id",
        "nombre",
        "direccion",
        "telefono",
        "horarioApertura",
        "horarioCierre",
        "diasLaborales",
        "tiposEnvio",
        "foto",
      ],
    });

    res.json({
      success: true,
      data: depositos,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/usuarios/fletes (lista de fletes disponibles)
exports.getFletes = async (req, res, next) => {
  try {
    const fletes = await Usuario.findAll({
      where: {
        tipoUsuario: "flete",
        activo: true,
        esOculto: false,
      },
      attributes: [
        "id",
        "nombre",
        "telefono",
        "vehiculoTipo",
        "vehiculoPatente",
        "vehiculoCapacidad",
      ],
    });

    res.json({
      success: true,
      data: fletes,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/usuarios/:id - Eliminar usuario permanentemente
exports.eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);

    if (!usuario) {
      throw new AppError("Usuario no encontrado", 404);
    }

    // No permitir eliminar admins
    if (usuario.tipoUsuario === "admin") {
      throw new AppError("No se puede eliminar un administrador", 403);
    }

    // No permitir eliminarse a sí mismo
    if (usuario.id === req.usuario.id) {
      throw new AppError("No puedes eliminar tu propia cuenta", 403);
    }

    await usuario.destroy();

    res.json({
      success: true,
      message: "Usuario eliminado permanentemente",
    });
  } catch (error) {
    next(error);
  }
};
