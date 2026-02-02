import axios from "axios";

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Aquí puedes agregar token de autenticación si es necesario
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
    return response;
  },
  (error) => {
    // Manejo global de errores
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expirado o no autorizado
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/login";
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
          console.error("Error en la petición");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
