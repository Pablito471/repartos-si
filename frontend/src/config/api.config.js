/**
 * Configuración de API - Backend Local vs Render
 *
 * Para cambiar entre backend local y en la nube:
 * 1. Crea un archivo .env.local en la raíz de frontend/
 * 2. Define NEXT_PUBLIC_API_URL con la URL deseada
 *
 * O simplemente cambia USE_LOCAL_BACKEND a true/false para desarrollo rápido
 */

// ============================================
// CONFIGURACIÓN RÁPIDA (cambiar aquí para desarrollo)
// ============================================
const USE_LOCAL_BACKEND = true; // Cambiar a false para usar Render

// ============================================
// URLs de los backends
// ============================================
const BACKEND_URLS = {
  local: "http://localhost:5000/api",
  render: "https://repartos-si.onrender.com/api",
};

// ============================================
// Configuración exportada
// ============================================

/**
 * Obtiene la URL del backend según la configuración
 * Prioridad:
 * 1. Variable de entorno NEXT_PUBLIC_API_URL
 * 2. Configuración USE_LOCAL_BACKEND
 */
export const getApiUrl = () => {
  // Si hay variable de entorno, usarla (tiene prioridad)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Si no, usar la configuración manual
  return USE_LOCAL_BACKEND ? BACKEND_URLS.local : BACKEND_URLS.render;
};

/**
 * URL del API activa
 */
export const API_URL = getApiUrl();

/**
 * URLs disponibles para referencia
 */
export const URLS = BACKEND_URLS;

/**
 * Indica si está usando backend local
 */
export const isLocalBackend = () => {
  const url = getApiUrl();
  return url.includes("localhost") || url.includes("127.0.0.1");
};

/**
 * Configuración de Pusher
 */
export const PUSHER_CONFIG = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
};

export default {
  API_URL,
  URLS,
  getApiUrl,
  isLocalBackend,
  PUSHER_CONFIG,
};
