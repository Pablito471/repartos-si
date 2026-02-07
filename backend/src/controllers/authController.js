const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Usuario } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const emailService = require("../services/emailService");

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

    // Validar fortaleza de contraseña
    const validacionPassword = Usuario.validarFortalezaPassword(password);
    if (!validacionPassword.valido) {
      throw new AppError(validacionPassword.errores.join(". "), 400);
    }

    // Verificar si ya existe el email
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      throw new AppError("El email ya está registrado", 400);
    }

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Crear usuario con token de verificación
    const usuario = await Usuario.create({
      email,
      password,
      tipoUsuario,
      nombre,
      telefono,
      direccion,
      emailVerificado: false,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 3600000), // 24 horas
    });

    // Enviar email de bienvenida con enlace de verificación
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verificar-email?token=${verificationToken}`;
    await emailService.enviarEmailBienvenida(usuario, verificationUrl);

    const token = generarToken(usuario);

    res.status(201).json({
      success: true,
      message:
        "Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.",
      data: {
        usuario,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
      // Campos de vehículo para fletes
      vehiculoTipo,
      vehiculoPatente,
      vehiculoCapacidad,
      licenciaTipo,
      licenciaVencimiento,
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
    // Campos de vehículo para fletes
    if (vehiculoTipo !== undefined) datosActualizar.vehiculoTipo = vehiculoTipo;
    if (vehiculoPatente !== undefined)
      datosActualizar.vehiculoPatente = vehiculoPatente;
    if (vehiculoCapacidad !== undefined)
      datosActualizar.vehiculoCapacidad = vehiculoCapacidad;
    if (licenciaTipo !== undefined) datosActualizar.licenciaTipo = licenciaTipo;
    if (licenciaVencimiento !== undefined)
      datosActualizar.licenciaVencimiento = licenciaVencimiento;

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

    // Validar fortaleza de contraseña nueva
    const validacionPassword = Usuario.validarFortalezaPassword(passwordNuevo);
    if (!validacionPassword.valido) {
      throw new AppError(validacionPassword.errores.join(". "), 400);
    }

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

// POST /api/auth/solicitar-recuperacion
exports.solicitarRecuperacion = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });

    // Siempre responder igual para no revelar si el email existe
    if (!usuario) {
      return res.json({
        success: true,
        message: "Si el email existe, recibirás un enlace de recuperación",
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Guardar token hasheado y expiración (1 hora)
    usuario.resetPasswordToken = resetTokenHash;
    usuario.resetPasswordExpires = new Date(Date.now() + 3600000);
    await usuario.save();

    // URL de reset (asumiendo que el frontend está en FRONTEND_URL)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // Enviar email
    await emailService.enviarEmailRecuperacionPassword(usuario, resetUrl);

    res.json({
      success: true,
      message: "Si el email existe, recibirás un enlace de recuperación",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Hashear el token recibido para comparar
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      where: {
        resetPasswordToken: resetTokenHash,
      },
    });

    if (!usuario) {
      throw new AppError("Token inválido o expirado", 400);
    }

    // Verificar expiración
    if (new Date() > usuario.resetPasswordExpires) {
      usuario.resetPasswordToken = null;
      usuario.resetPasswordExpires = null;
      await usuario.save();
      throw new AppError("Token expirado. Solicita uno nuevo.", 400);
    }

    // Validar fortaleza de contraseña
    const validacionPassword = Usuario.validarFortalezaPassword(password);
    if (!validacionPassword.valido) {
      throw new AppError(validacionPassword.errores.join(". "), 400);
    }

    // Actualizar contraseña y limpiar tokens
    usuario.password = password;
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await usuario.save();

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verificar-email
exports.verificarEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError("Token de verificación requerido", 400);
    }

    // Hashear el token recibido para comparar
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Buscar usuario con token válido
    const usuario = await Usuario.findOne({
      where: {
        emailVerificationToken: verificationTokenHash,
      },
    });

    if (!usuario) {
      throw new AppError("Token inválido o ya utilizado", 400);
    }

    // Verificar expiración
    if (new Date() > usuario.emailVerificationExpires) {
      throw new AppError(
        "El enlace de verificación ha expirado. Por favor, solicita uno nuevo.",
        400,
      );
    }

    // Verificar el email
    usuario.emailVerificado = true;
    usuario.emailVerificationToken = null;
    usuario.emailVerificationExpires = null;
    await usuario.save();

    res.json({
      success: true,
      message: "¡Email verificado exitosamente! Ya puedes iniciar sesión.",
      data: {
        usuario,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reenviar-verificacion
exports.reenviarVerificacion = async (req, res, next) => {
  try {
    const { email } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });

    // Siempre responder igual para no revelar si el email existe
    if (!usuario || usuario.emailVerificado) {
      return res.json({
        success: true,
        message:
          "Si el email existe y no está verificado, recibirás un nuevo enlace.",
      });
    }

    // Generar nuevo token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    usuario.emailVerificationToken = verificationTokenHash;
    usuario.emailVerificationExpires = new Date(Date.now() + 24 * 3600000);
    await usuario.save();

    // Enviar email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verificar-email?token=${verificationToken}`;
    await emailService.enviarEmailBienvenida(usuario, verificationUrl);

    res.json({
      success: true,
      message:
        "Si el email existe y no está verificado, recibirás un nuevo enlace.",
    });
  } catch (error) {
    next(error);
  }
};
