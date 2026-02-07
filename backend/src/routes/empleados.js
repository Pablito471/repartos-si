const express = require("express");
const router = express.Router();
const empleadosController = require("../controllers/empleadosController");
const { auth, requireRole } = require("../middleware/auth");

// ==================== RUTAS PARA EMPLEADOS (ESCÁNER) ====================
// Estas rutas son para usuarios tipo "empleado"

// GET /api/empleados/escaner/buscar/:codigo - Buscar producto (empleados)
router.get(
  "/escaner/buscar/:codigo",
  auth,
  requireRole("empleado"),
  empleadosController.buscarProductoPorCodigo,
);

// POST /api/empleados/escaner/vender - Realizar venta (empleados)
router.post(
  "/escaner/vender",
  auth,
  requireRole("empleado"),
  empleadosController.realizarVenta,
);

// POST /api/empleados/escaner/agregar-stock - Agregar al stock (empleados)
router.post(
  "/escaner/agregar-stock",
  auth,
  requireRole("empleado"),
  empleadosController.agregarStock,
);

// POST /api/empleados/escaner/crear-producto - Crear nuevo producto (empleados)
router.post(
  "/escaner/crear-producto",
  auth,
  requireRole("empleado"),
  empleadosController.crearProducto,
);

// ==================== RUTAS PARA GESTIÓN DE EMPLEADOS ====================
// Estas rutas son para clientes y depósitos que gestionan sus empleados

// GET /api/empleados/estadisticas - Estadísticas de todos los empleados
router.get(
  "/estadisticas",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.getEstadisticasEmpleados,
);

// GET /api/empleados - Listar empleados
router.get(
  "/",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.getEmpleados,
);

// POST /api/empleados - Crear empleado
router.post(
  "/",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.crearEmpleado,
);

// PUT /api/empleados/:id - Actualizar empleado
router.put(
  "/:id",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.actualizarEmpleado,
);

// PUT /api/empleados/:id/password - Cambiar contraseña
router.put(
  "/:id/password",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.cambiarPasswordEmpleado,
);

// PUT /api/empleados/:id/toggle - Activar/desactivar
router.put(
  "/:id/toggle",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.toggleEmpleado,
);

// GET /api/empleados/:id/estadisticas - Estadísticas de empleado específico
router.get(
  "/:id/estadisticas",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.getEstadisticasEmpleado,
);

// DELETE /api/empleados/:id - Eliminar empleado
router.delete(
  "/:id",
  auth,
  requireRole("cliente", "deposito"),
  empleadosController.eliminarEmpleado,
);

module.exports = router;
