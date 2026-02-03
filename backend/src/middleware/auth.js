const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. Token no proporcionado.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: "Usuario desactivado.",
      });
    }

    req.usuario = usuario;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error de autenticación.",
    });
  }
};

// Middleware para verificar tipo de usuario
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: "No autenticado.",
      });
    }

    if (!roles.includes(req.usuario.tipoUsuario)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para realizar esta acción.",
      });
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const authOptional = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findByPk(decoded.id);
      if (usuario && usuario.activo) {
        req.usuario = usuario;
        req.token = token;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, requireRole, authOptional };
