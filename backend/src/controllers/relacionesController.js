const { UsuarioRelacion, Usuario } = require("../models");
const { Op } = require("sequelize");

// Obtener todas las relaciones de un usuario
exports.getRelaciones = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const relaciones = await UsuarioRelacion.findAll({
      where: {
        [Op.or]: [
          { usuarioOrigenId: usuarioId },
          { usuarioDestinoId: usuarioId },
        ],
        activo: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuarioOrigen",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "direccion",
          ],
        },
        {
          model: Usuario,
          as: "usuarioDestino",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "direccion",
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: relaciones,
    });
  } catch (error) {
    console.error("Error al obtener relaciones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener relaciones",
    });
  }
};

// Obtener depósitos vinculados a un cliente
exports.getDepositosCliente = async (req, res) => {
  try {
    const clienteId = req.params.clienteId || req.usuario.id;

    const relaciones = await UsuarioRelacion.findAll({
      where: {
        usuarioOrigenId: clienteId,
        tipoRelacion: "cliente_deposito",
        activo: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuarioDestino",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "direccion",
            "horarioApertura",
            "horarioCierre",
            "diasLaborales",
            "tiposEnvio",
          ],
        },
      ],
    });

    const depositos = relaciones.map((r) => r.usuarioDestino);

    res.json({
      success: true,
      data: depositos,
    });
  } catch (error) {
    console.error("Error al obtener depósitos del cliente:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener depósitos vinculados",
    });
  }
};

// Obtener clientes vinculados a un depósito
exports.getClientesDeposito = async (req, res) => {
  try {
    const depositoId = req.params.depositoId || req.usuario.id;

    const relaciones = await UsuarioRelacion.findAll({
      where: {
        usuarioDestinoId: depositoId,
        tipoRelacion: "cliente_deposito",
        activo: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuarioOrigen",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "direccion",
          ],
        },
      ],
    });

    const clientes = relaciones.map((r) => r.usuarioOrigen);

    res.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error("Error al obtener clientes del depósito:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener clientes vinculados",
    });
  }
};

// Obtener fletes vinculados a un depósito
exports.getFletesDeposito = async (req, res) => {
  try {
    const depositoId = req.params.depositoId || req.usuario.id;

    const relaciones = await UsuarioRelacion.findAll({
      where: {
        usuarioOrigenId: depositoId,
        tipoRelacion: "deposito_flete",
        activo: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuarioDestino",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "vehiculoTipo",
            "vehiculoPatente",
            "vehiculoCapacidad",
          ],
        },
      ],
    });

    const fletes = relaciones.map((r) => r.usuarioDestino);

    res.json({
      success: true,
      data: fletes,
    });
  } catch (error) {
    console.error("Error al obtener fletes del depósito:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener fletes vinculados",
    });
  }
};

// Obtener depósitos vinculados a un flete
exports.getDepositosFlete = async (req, res) => {
  try {
    const fleteId = req.params.fleteId || req.usuario.id;

    const relaciones = await UsuarioRelacion.findAll({
      where: {
        usuarioDestinoId: fleteId,
        tipoRelacion: "deposito_flete",
        activo: true,
      },
      include: [
        {
          model: Usuario,
          as: "usuarioOrigen",
          attributes: [
            "id",
            "nombre",
            "email",
            "tipoUsuario",
            "foto",
            "telefono",
            "direccion",
            "horarioApertura",
            "horarioCierre",
          ],
        },
      ],
    });

    const depositos = relaciones.map((r) => r.usuarioOrigen);

    res.json({
      success: true,
      data: depositos,
    });
  } catch (error) {
    console.error("Error al obtener depósitos del flete:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener depósitos vinculados",
    });
  }
};

// Crear una relación
exports.crearRelacion = async (req, res) => {
  try {
    const { usuarioOrigenId, usuarioDestinoId, tipoRelacion, metadata } =
      req.body;

    // Validar que los usuarios existen
    const [usuarioOrigen, usuarioDestino] = await Promise.all([
      Usuario.findByPk(usuarioOrigenId),
      Usuario.findByPk(usuarioDestinoId),
    ]);

    if (!usuarioOrigen || !usuarioDestino) {
      return res.status(404).json({
        success: false,
        mensaje: "Uno o ambos usuarios no existen",
      });
    }

    // Validar tipos de usuario según el tipo de relación
    if (tipoRelacion === "cliente_deposito") {
      if (
        usuarioOrigen.tipoUsuario !== "cliente" ||
        usuarioDestino.tipoUsuario !== "deposito"
      ) {
        return res.status(400).json({
          success: false,
          mensaje:
            "Para cliente_deposito: origen debe ser cliente, destino debe ser depósito",
        });
      }
    } else if (tipoRelacion === "deposito_flete") {
      if (
        usuarioOrigen.tipoUsuario !== "deposito" ||
        usuarioDestino.tipoUsuario !== "flete"
      ) {
        return res.status(400).json({
          success: false,
          mensaje:
            "Para deposito_flete: origen debe ser depósito, destino debe ser flete",
        });
      }
    }

    // Verificar que no exista ya
    const existente = await UsuarioRelacion.findOne({
      where: {
        usuarioOrigenId,
        usuarioDestinoId,
        tipoRelacion,
      },
    });

    if (existente) {
      // Si existe pero está inactiva, reactivarla
      if (!existente.activo) {
        existente.activo = true;
        existente.metadata = metadata || existente.metadata;
        await existente.save();
        return res.json({
          success: true,
          mensaje: "Relación reactivada",
          data: existente,
        });
      }
      return res.status(400).json({
        success: false,
        mensaje: "Esta relación ya existe",
      });
    }

    const relacion = await UsuarioRelacion.create({
      usuarioOrigenId,
      usuarioDestinoId,
      tipoRelacion,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      mensaje: "Relación creada exitosamente",
      data: relacion,
    });
  } catch (error) {
    console.error("Error al crear relación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al crear la relación",
    });
  }
};

// Eliminar (desactivar) una relación
exports.eliminarRelacion = async (req, res) => {
  try {
    const { id } = req.params;

    const relacion = await UsuarioRelacion.findByPk(id);

    if (!relacion) {
      return res.status(404).json({
        success: false,
        mensaje: "Relación no encontrada",
      });
    }

    relacion.activo = false;
    await relacion.save();

    res.json({
      success: true,
      mensaje: "Relación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar relación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al eliminar la relación",
    });
  }
};

// Obtener fletes disponibles (no vinculados al depósito actual)
exports.getFletesDisponibles = async (req, res) => {
  try {
    const depositoId = req.usuario.id;

    // Obtener IDs de fletes ya vinculados
    const relacionesExistentes = await UsuarioRelacion.findAll({
      where: {
        usuarioOrigenId: depositoId,
        tipoRelacion: "deposito_flete",
        activo: true,
      },
      attributes: ["usuarioDestinoId"],
    });

    const fletesVinculadosIds = relacionesExistentes.map(
      (r) => r.usuarioDestinoId,
    );

    // Obtener todos los fletes activos que NO están vinculados
    const fletes = await Usuario.findAll({
      where: {
        tipoUsuario: "flete",
        activo: true,
        id: { [Op.notIn]: fletesVinculadosIds },
      },
      attributes: [
        "id",
        "nombre",
        "email",
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
    console.error("Error al obtener fletes disponibles:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener fletes disponibles",
    });
  }
};

// Vincular un flete al depósito actual
exports.vincularFlete = async (req, res) => {
  try {
    const depositoId = req.usuario.id;
    const { fleteId } = req.body;

    if (!fleteId) {
      return res.status(400).json({
        success: false,
        mensaje: "Se requiere el ID del flete",
      });
    }

    // Verificar que el flete existe y es del tipo correcto
    const flete = await Usuario.findByPk(fleteId);
    if (!flete || flete.tipoUsuario !== "flete") {
      return res.status(404).json({
        success: false,
        mensaje: "Flete no encontrado",
      });
    }

    // Verificar que no exista ya la relación
    const existente = await UsuarioRelacion.findOne({
      where: {
        usuarioOrigenId: depositoId,
        usuarioDestinoId: fleteId,
        tipoRelacion: "deposito_flete",
      },
    });

    if (existente) {
      if (!existente.activo) {
        existente.activo = true;
        await existente.save();
        return res.json({
          success: true,
          mensaje: "Flete vinculado nuevamente",
          data: existente,
        });
      }
      return res.status(400).json({
        success: false,
        mensaje: "Este flete ya está vinculado",
      });
    }

    const relacion = await UsuarioRelacion.create({
      usuarioOrigenId: depositoId,
      usuarioDestinoId: fleteId,
      tipoRelacion: "deposito_flete",
      metadata: {},
    });

    res.status(201).json({
      success: true,
      mensaje: "Flete vinculado exitosamente",
      data: relacion,
    });
  } catch (error) {
    console.error("Error al vincular flete:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al vincular el flete",
    });
  }
};

// Desvincular un flete del depósito actual
exports.desvincularFlete = async (req, res) => {
  try {
    const depositoId = req.usuario.id;
    const { fleteId } = req.params;

    const relacion = await UsuarioRelacion.findOne({
      where: {
        usuarioOrigenId: depositoId,
        usuarioDestinoId: fleteId,
        tipoRelacion: "deposito_flete",
        activo: true,
      },
    });

    if (!relacion) {
      return res.status(404).json({
        success: false,
        mensaje: "Relación no encontrada",
      });
    }

    relacion.activo = false;
    await relacion.save();

    res.json({
      success: true,
      mensaje: "Flete desvinculado exitosamente",
    });
  } catch (error) {
    console.error("Error al desvincular flete:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al desvincular el flete",
    });
  }
};

// Obtener todas las relaciones (para admin)
exports.getAllRelaciones = async (req, res) => {
  try {
    const relaciones = await UsuarioRelacion.findAll({
      include: [
        {
          model: Usuario,
          as: "usuarioOrigen",
          attributes: ["id", "nombre", "email", "tipoUsuario"],
        },
        {
          model: Usuario,
          as: "usuarioDestino",
          attributes: ["id", "nombre", "email", "tipoUsuario"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: relaciones,
    });
  } catch (error) {
    console.error("Error al obtener todas las relaciones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener relaciones",
    });
  }
};
