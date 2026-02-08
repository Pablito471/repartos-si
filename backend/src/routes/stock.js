const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const { auth } = require("../middleware/auth");

// Todas las rutas requieren autenticación
router.use(auth);

// GET /api/stock - Obtener stock agrupado del cliente
router.get("/", stockController.obtenerStock);

// GET /api/stock/detallado - Obtener stock con detalle de cada entrada
router.get("/detallado", stockController.obtenerStockDetallado);

// GET /api/stock/totales - Obtener totales del stock
router.get("/totales", stockController.obtenerTotales);

// GET /api/stock/historial - Obtener historial de entregas
router.get("/historial", stockController.obtenerHistorial);

// GET /api/stock/categorias - Obtener categorías del cliente
router.get("/categorias", stockController.obtenerCategorias);

// POST /api/stock/agregar - Agregar producto manualmente
router.post("/agregar", stockController.agregarProducto);

// POST /api/stock/agregar-desde-pedido/:pedidoId - Agregar desde pedido entregado
router.post(
  "/agregar-desde-pedido/:pedidoId",
  stockController.agregarDesdePedido,
);

// POST /api/stock/descontar - Descontar stock (venta)
router.post("/descontar", stockController.descontarStock);

// POST /api/stock/descontar-por-codigo - Descontar por código de barras
router.post("/descontar-por-codigo", stockController.descontarPorCodigo);

// POST /api/stock/generar-codigo - Generar código de barras para un producto
router.post("/generar-codigo", stockController.generarCodigoBarras);

// POST /api/stock/agregar-stock/:codigo - Agregar stock a producto existente por código
router.post("/agregar-stock/:codigo", stockController.agregarStockPorCodigo);

// GET /api/stock/buscar-por-codigo/:codigo - Buscar producto por código
router.get("/buscar-por-codigo/:codigo", stockController.buscarPorCodigo);

// GET /api/stock/buscar?termino=xxx - Buscar productos por nombre
router.get("/buscar", stockController.buscarProductos);

// PUT /api/stock/:id - Actualizar un producto
router.put("/:id", stockController.actualizarStock);

// DELETE /api/stock/:id - Eliminar un producto
router.delete("/:id", stockController.eliminarProducto);

// POST /api/stock/asociar-codigo - Asociar código alternativo a producto
router.post("/asociar-codigo", stockController.asociarCodigoAlternativo);

// POST /api/stock/sincronizar-tablas - Sincronizar tablas (desarrollo)
router.post("/sincronizar-tablas", stockController.sincronizarTablas);

module.exports = router;
