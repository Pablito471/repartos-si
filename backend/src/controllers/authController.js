const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");
const { AppError } = require("../middleware/errorHandler");

// Generar token JWT
const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipoUsuario: usuario.tipoUsuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

// POST /api/auth/registro
exports.registro = async (req, res, next) => {
  try {
    const { email, password, tipoUsuario, nombre, telefono, direccion } =
      req.body;

    // Verificar si ya existe el email
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      throw new AppError("El email ya está registrado", 400);
    }

    // Crear usuario
    const usuario = await Usuario.create({
      email,
      password,
      tipoUsuario,
      nombre,
      telefono,
      direccion,
    });

    const token = generarToken(usuario);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        usuario,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      throw new AppError("Credenciales inválidas", 401);
    }

    // Verificar si está activo
    if (!usuario.activo) {
      throw new AppError(
        "Usuario desactivado. Contacta al administrador.",
        403,
      );
    }

    // Verificar password
    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const token = generarToken(usuario);

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: {
        usuario,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        usuario: req.usuario,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/perfil
exports.actualizarPerfil = async (req, res, next) => {
  try {
    const {
      nombre,
      telefono,
      direccion,
      foto,
      datosFiscales,
      horarioApertura,
      horarioCierre,
      diasLaborales,
      capacidadMaxima,
      alertaStockMinimo,
      descripcion,
    } = req.body;

    // Construir objeto con solo los campos que vienen definidos
    const datosActualizar = {};
    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (direccion !== undefined) datosActualizar.direccion = direccion;
    if (foto !== undefined) datosActualizar.foto = foto;
    if (datosFiscales !== undefined)
      datosActualizar.datosFiscales = datosFiscales;
    if (horarioApertura !== undefined)
      datosActualizar.horarioApertura = horarioApertura;
    if (horarioCierre !== undefined)
      datosActualizar.horarioCierre = horarioCierre;
    if (diasLaborales !== undefined)
      datosActualizar.diasLaborales = diasLaborales;
    if (capacidadMaxima !== undefined)
      datosActualizar.capacidadMaxima = capacidadMaxima;
    if (alertaStockMinimo !== undefined)
      datosActualizar.alertaStockMinimo = alertaStockMinimo;
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;

    await req.usuario.update(datosActualizar);

    res.json({
      success: true,
      message: "Perfil actualizado",
      data: {
        usuario: req.usuario,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/cambiar-password
exports.cambiarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    // Verificar password actual
    const passwordValido = await req.usuario.validarPassword(passwordActual);
    if (!passwordValido) {
      throw new AppError("Password actual incorrecto", 400);
    }

    req.usuario.password = passwordNuevo;
    await req.usuario.save();

    res.json({
      success: true,
      message: "Password actualizado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
