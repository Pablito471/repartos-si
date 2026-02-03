import axios from "axios";

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      const mensaje =
        error.response.data?.mensaje || error.response.data?.error;

      switch (error.response.status) {
        case 401:
          // Token expirado o no autorizado
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            // No redirigir automáticamente, dejar que el contexto maneje esto
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

      // Propagar el error con mensaje del servidor
      throw new Error(mensaje || "Error en la solicitud");
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
      localStorage.setItem("token", data.token);
    }
    return data;
  },

  registro: async (userData) => {
    const response = await api.post("/auth/registro", userData);
    const data = response.data || response;
    if (data.token) {
      localStorage.setItem("token", data.token);
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

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
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

  eliminar: (id) => api.delete(`/productos/${id}`),

  actualizarStock: (id, cantidad, tipo = "agregar") =>
    api.patch(`/productos/${id}/stock`, { cantidad, tipo }),

  getByDeposito: (depositoId) => api.get(`/productos/deposito/${depositoId}`),
};

// ============== PEDIDOS ==============
export const pedidosService = {
  getAll: (params = {}) => api.get("/pedidos", { params }),

  getById: (id) => api.get(`/pedidos/${id}`),

  crear: (pedidoData) => api.post("/pedidos", pedidoData),

  actualizar: (id, pedidoData) => api.put(`/pedidos/${id}`, pedidoData),

  eliminar: (id) => api.delete(`/pedidos/${id}`),

  cambiarEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),

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
    api.patch(`/envios/${id}/ubicacion`, { ubicacion }),

  cambiarEstado: (id, estado) => api.patch(`/envios/${id}/estado`, { estado }),

  getActivos: () => api.get("/envios/activos"),

  getMisEnvios: () => api.get("/envios/mis-envios"),
};

// ============== CALIFICACIONES ==============
export const calificacionesService = {
  getAll: (params = {}) => api.get("/calificaciones", { params }),

  crear: (calificacionData) => api.post("/calificaciones", calificacionData),

  getByUsuario: (usuarioId) => api.get(`/calificaciones/usuario/${usuarioId}`),

  getMisCalificaciones: () => api.get("/calificaciones/mis-calificaciones"),

  getEstadisticas: () => api.get("/calificaciones/estadisticas"),
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

// ============== HEALTH CHECK ==============
export const healthCheck = () => api.get("/health");

export default api;
