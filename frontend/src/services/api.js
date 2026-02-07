import axios from "axios";
import { API_URL, isLocalBackend } from "../config/api.config";

if (typeof window !== "undefined") {
  console.log(
    `🔗 API conectada a: ${API_URL} (${isLocalBackend() ? "LOCAL" : "RENDER"})`,
  );
}

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos para conexiones lentas
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe (sessionStorage para multisesión)
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `📤 ${config.method?.toUpperCase()} ${config.url}`,
      token ? "(con token)" : "(sin token)",
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    // Devolver response.data directamente para mantener compatibilidad
    return response.data;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      const mensaje =
        error.response.data?.message ||
        error.response.data?.mensaje ||
        error.response.data?.error;

      switch (error.response.status) {
        case 401:
          // Token expirado o no autorizado
          console.warn("🔒 Error 401 - No autorizado");
          if (typeof window !== "undefined") {
            // Solo limpiar si estamos en una página protegida
            // localStorage.removeItem("token");
            // localStorage.removeItem("currentUser");
          }
          break;
        case 403:
          console.error("No tienes permisos para realizar esta acción");
          break;
        case 404:
          console.error("Recurso no encontrado");
          break;
        case 500:
          console.error("Error interno del servidor");
          break;
        default:
          console.error("Error en la petición:", mensaje);
      }

      // Propagar el error con más información
      const customError = new Error(mensaje || "Error en la solicitud");
      customError.response = error.response;
      customError.status = error.response.status;
      throw customError;
    }
    return Promise.reject(error);
  },
);

// ============== AUTH ==============
export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    // La respuesta viene como { success, message, data: { usuario, token } }
    const data = response.data || response;
    if (data.token) {
      sessionStorage.setItem("token", data.token);
    }
    return data;
  },

  registro: async (userData) => {
    const response = await api.post("/auth/registro", userData);
    const data = response.data || response;
    if (data.token) {
      sessionStorage.setItem("token", data.token);
    }
    return data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data || response;
  },

  actualizarPerfil: (data) => api.put("/auth/perfil", data),

  cambiarPassword: (passwordActual, passwordNueva) =>
    api.put("/auth/password", { passwordActual, passwordNueva }),

  solicitarRecuperacion: (email) =>
    api.post("/auth/solicitar-recuperacion", { email }),

  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),

  verificarEmail: (token) => api.post("/auth/verificar-email", { token }),

  reenviarVerificacion: (email) =>
    api.post("/auth/reenviar-verificacion", { email }),

  logout: () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("currentUser");
  },
};

// ============== USUARIOS ==============
export const usuariosService = {
  getAll: (params = {}) => api.get("/usuarios", { params }),

  getById: (id) => api.get(`/usuarios/${id}`),

  crear: (userData) => api.post("/usuarios", userData),

  actualizar: (id, userData) => api.put(`/usuarios/${id}`, userData),

  eliminar: (id) => api.delete(`/usuarios/${id}`),

  activar: (id) => api.put(`/usuarios/${id}/activar`),

  desactivar: (id) => api.put(`/usuarios/${id}/desactivar`),

  getDepositos: () => api.get("/usuarios/depositos"),

  getFletes: () => api.get("/usuarios/fletes"),
};

// ============== PRODUCTOS ==============
export const productosService = {
  getAll: (params = {}) => api.get("/productos", { params }),

  getById: (id) => api.get(`/productos/${id}`),

  crear: (productoData) => api.post("/productos", productoData),

  actualizar: (id, productoData) => api.put(`/productos/${id}`, productoData),

  // Borrado lógico (soft delete)
  eliminar: (id) => api.delete(`/productos/${id}`),

  // Borrado permanente (hard delete)
  eliminarPermanente: (id) => api.delete(`/productos/${id}/permanente`),

  // Reactivar producto (deshacer borrado lógico)
  reactivar: (id) => api.put(`/productos/${id}/reactivar`),

  // Obtener productos inactivos
  getInactivos: () => api.get("/productos/inactivos"),

  actualizarStock: (id, cantidad, tipo = "agregar") =>
    api.put(`/productos/${id}/stock`, { cantidad, tipo }),

  getByDeposito: (depositoId) => api.get(`/productos/deposito/${depositoId}`),

  // Buscar producto por código de barras
  buscarPorCodigo: (codigo) => api.get(`/productos/buscar-codigo/${codigo}`),

  // Registrar movimiento de stock (entrada/salida)
  registrarMovimientoStock: (id, cantidad, tipo, motivo) =>
    api.put(`/productos/${id}/movimiento-stock`, { cantidad, tipo, motivo }),
};

// ============== PEDIDOS ==============
export const pedidosService = {
  getAll: (params = {}) => api.get("/pedidos", { params }),

  getById: (id) => api.get(`/pedidos/${id}`),

  crear: (pedidoData) => api.post("/pedidos", pedidoData),

  actualizar: (id, pedidoData) => api.put(`/pedidos/${id}`, pedidoData),

  eliminar: (id) => api.delete(`/pedidos/${id}`),

  cambiarEstado: (id, estado) => api.put(`/pedidos/${id}/estado`, { estado }),

  getMisPedidos: () => api.get("/pedidos/mis-pedidos"),

  getPedidosDeposito: () => api.get("/pedidos/deposito"),
};

// ============== ENVÍOS ==============
export const enviosService = {
  getAll: (params = {}) => api.get("/envios", { params }),

  getById: (id) => api.get(`/envios/${id}`),

  crear: (envioData) => api.post("/envios", envioData),

  actualizar: (id, envioData) => api.put(`/envios/${id}`, envioData),

  eliminar: (id) => api.delete(`/envios/${id}`),

  actualizarUbicacion: (id, ubicacion) =>
    api.put(`/envios/${id}/ubicacion`, ubicacion),

  cambiarEstado: (id, estado, notas = "") =>
    api.put(`/envios/${id}/estado`, { estado, notas }),

  getActivos: () => api.get("/envios/activos"),

  getActivosFlete: () => api.get("/envios/flete/activos"),

  getMisEnvios: () => api.get("/envios/mis-envios"),
};

// ============== CALIFICACIONES ==============
export const calificacionesService = {
  getAll: (params = {}) => api.get("/calificaciones", { params }),

  crear: (calificacionData) => api.post("/calificaciones", calificacionData),

  getByUsuario: (usuarioId) => api.get(`/calificaciones/usuario/${usuarioId}`),

  getMisCalificaciones: () => api.get("/calificaciones/mis-calificaciones"),

  getEstadisticas: () => api.get("/calificaciones/estadisticas"),

  getPendientes: () => api.get("/calificaciones/pendientes"),

  getPromedio: (usuarioId) => api.get(`/calificaciones/promedio/${usuarioId}`),
};

// ============== ENTREGAS ==============
export const entregasService = {
  getAll: (params = {}) => api.get("/entregas", { params }),

  getById: (id) => api.get(`/entregas/${id}`),

  crear: (entregaData) => api.post("/entregas", entregaData),

  confirmar: (codigoEntrega) =>
    api.post(`/entregas/confirmar/${codigoEntrega}`),

  getByCodigo: (codigoEntrega) => api.get(`/entregas/codigo/${codigoEntrega}`),
};

// ============== RELACIONES ==============
export const relacionesService = {
  // Obtener todas las relaciones (admin)
  getAll: () => api.get("/relaciones"),

  // Crear una nueva relación
  crear: (relacionData) => api.post("/relaciones", relacionData),

  // Eliminar una relación
  eliminar: (id) => api.delete(`/relaciones/${id}`),

  // Obtener relaciones de un usuario
  getByUsuario: (usuarioId) => api.get(`/relaciones/usuario/${usuarioId}`),

  // Obtener depósitos vinculados al cliente actual
  getMisDepositos: () => api.get("/relaciones/cliente/depositos"),

  // Obtener depósitos de un cliente específico
  getDepositosCliente: (clienteId) =>
    api.get(`/relaciones/cliente/${clienteId}/depositos`),

  // Obtener clientes del depósito actual
  getMisClientes: () => api.get("/relaciones/deposito/clientes"),

  // Obtener clientes de un depósito específico
  getClientesDeposito: (depositoId) =>
    api.get(`/relaciones/deposito/${depositoId}/clientes`),

  // Obtener fletes del depósito actual
  getMisFletes: () => api.get("/relaciones/deposito/fletes"),

  // Obtener fletes de un depósito específico
  getFletesDeposito: (depositoId) =>
    api.get(`/relaciones/deposito/${depositoId}/fletes`),

  // Obtener fletes disponibles para vincular
  getFletesDisponibles: () =>
    api.get("/relaciones/deposito/fletes-disponibles"),

  // Vincular un flete al depósito
  vincularFlete: (fleteId) =>
    api.post("/relaciones/deposito/vincular-flete", { fleteId }),

  // Desvincular un flete del depósito
  desvincularFlete: (fleteId) =>
    api.delete(`/relaciones/deposito/desvincular-flete/${fleteId}`),

  // Obtener depósitos del flete actual
  getMisDepositosFlete: () => api.get("/relaciones/flete/depositos"),

  // Obtener depósitos de un flete específico
  getDepositosFlete: (fleteId) =>
    api.get(`/relaciones/flete/${fleteId}/depositos`),
};

// ============== CHAT ==============
export const chatService = {
  // Obtener o crear conversación con admin
  getMiConversacion: () => api.get("/chat/mi-conversacion"),

  // Obtener todas las conversaciones (admin)
  getConversaciones: () => api.get("/chat/conversaciones"),

  // Obtener mensajes de una conversación
  getMensajes: (conversacionId, page = 1, limit = 50) =>
    api.get(`/chat/${conversacionId}/mensajes`, { params: { page, limit } }),

  // Enviar mensaje
  enviarMensaje: (conversacionId, contenido, tipo = "texto") =>
    api.post(`/chat/${conversacionId}/mensajes`, { contenido, tipo }),

  // Marcar mensajes como leídos
  marcarLeidos: (conversacionId) => api.put(`/chat/${conversacionId}/leidos`),

  // Obtener cantidad de mensajes no leídos
  getNoLeidos: () => api.get("/chat/no-leidos"),

  // Cerrar conversación (admin)
  cerrarConversacion: (conversacionId) =>
    api.put(`/chat/${conversacionId}/cerrar`),
};

// ============== MOVIMIENTOS CONTABLES ==============
export const movimientosService = {
  // Obtener todos los movimientos del usuario
  listar: (params = {}) => api.get("/movimientos", { params }),

  // Obtener totales y estadísticas
  getTotales: (params = {}) => api.get("/movimientos/totales", { params }),

  // Obtener movimiento por ID
  getById: (id) => api.get(`/movimientos/${id}`),

  // Crear nuevo movimiento
  crear: (movimiento) => api.post("/movimientos", movimiento),

  // Registrar movimiento desde pedido
  registrarPedido: (pedidoId, tipo) =>
    api.post("/movimientos/registrar-pedido", { pedidoId, tipo }),

  // Actualizar movimiento
  actualizar: (id, datos) => api.put(`/movimientos/${id}`, datos),

  // Eliminar movimiento
  eliminar: (id) => api.delete(`/movimientos/${id}`),
};

// ============== STOCK CLIENTE ==============
export const stockService = {
  // Obtener stock agrupado del cliente
  obtenerStock: () => api.get("/stock"),

  // Obtener stock detallado
  obtenerDetallado: () => api.get("/stock/detallado"),

  // Obtener totales del stock
  obtenerTotales: () => api.get("/stock/totales"),

  // Obtener historial de entregas
  obtenerHistorial: () => api.get("/stock/historial"),

  // Obtener categorías del cliente
  obtenerCategorias: () => api.get("/stock/categorias"),

  // Agregar producto manualmente
  agregarProducto: (producto) => api.post("/stock/agregar", producto),

  // Agregar desde pedido entregado
  agregarDesdePedido: (pedidoId) =>
    api.post(`/stock/agregar-desde-pedido/${pedidoId}`),

  // Descontar stock (venta)
  descontarStock: (
    nombre,
    cantidad,
    motivo,
    precioVenta,
    registrarVenta = true,
  ) =>
    api.post("/stock/descontar", {
      nombre,
      cantidad,
      motivo,
      precioVenta,
      registrarVenta,
    }),

  // Descontar por código de barras
  descontarPorCodigo: (codigo, cantidad = 1, motivo, precioVenta) =>
    api.post("/stock/descontar-por-codigo", {
      codigo,
      cantidad,
      motivo,
      precioVenta,
    }),

  // Buscar producto por código de barras
  buscarPorCodigo: (codigo) => api.get(`/stock/buscar-por-codigo/${codigo}`),

  // Generar código de barras para un producto
  generarCodigoBarras: (nombre) =>
    api.post("/stock/generar-codigo", { nombre }),

  // Actualizar producto
  actualizar: (id, datos) => api.put(`/stock/${id}`, datos),

  // Eliminar producto
  eliminar: (id) => api.delete(`/stock/${id}`),
};

// ============== EMPLEADOS ==============
export const empleadosAPI = {
  // Listar empleados
  listar: () => api.get("/empleados"),

  // Crear empleado
  crear: (datos) => api.post("/empleados", datos),

  // Actualizar empleado
  actualizar: (id, datos) => api.put(`/empleados/${id}`, datos),

  // Cambiar contraseña
  cambiarPassword: (id, password) =>
    api.put(`/empleados/${id}/password`, { password }),

  // Activar/desactivar empleado
  toggle: (id) => api.put(`/empleados/${id}/toggle`),

  // Eliminar empleado
  eliminar: (id) => api.delete(`/empleados/${id}`),

  // === Funciones para el escáner del empleado ===
  // Buscar producto por código
  buscarProducto: (codigo) => api.get(`/empleados/escaner/buscar/${codigo}`),

  // Realizar venta
  vender: (productoId, cantidad, precioVenta) =>
    api.post("/empleados/escaner/vender", {
      productoId,
      cantidad,
      precioVenta,
    }),

  // Agregar stock
  agregarStock: (productoId, cantidad) =>
    api.post("/empleados/escaner/agregar-stock", {
      productoId,
      cantidad,
    }),

  // Crear producto nuevo
  crearProducto: (datos) =>
    api.post("/empleados/escaner/crear-producto", datos),

  // === Estadísticas ===
  // Obtener estadísticas de todos los empleados
  obtenerEstadisticas: (fechaDesde, fechaHasta) => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fechaDesde", fechaDesde);
    if (fechaHasta) params.append("fechaHasta", fechaHasta);
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/empleados/estadisticas${query}`);
  },

  // Obtener estadísticas de un empleado específico
  obtenerEstadisticasEmpleado: (id, fechaDesde, fechaHasta) => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append("fechaDesde", fechaDesde);
    if (fechaHasta) params.append("fechaHasta", fechaHasta);
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/empleados/${id}/estadisticas${query}`);
  },
};

// ============== HEALTH CHECK ==============
export const healthCheck = () => api.get("/health");

export default api;
