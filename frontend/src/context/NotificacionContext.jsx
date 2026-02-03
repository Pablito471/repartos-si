import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const NotificacionContext = createContext(null);

export function NotificacionProvider({ children }) {
  const { usuario } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  // Obtener token desde localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Cargar notificaciones desde localStorage
  useEffect(() => {
    if (usuario) {
      const saved = localStorage.getItem(`notificaciones_${usuario.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotificaciones(parsed);
          setNoLeidas(parsed.filter((n) => !n.leida).length);
        } catch (e) {
          console.error("Error parsing notifications:", e);
        }
      }
    }
  }, [usuario]);

  // Guardar notificaciones en localStorage
  useEffect(() => {
    if (usuario && notificaciones.length > 0) {
      localStorage.setItem(
        `notificaciones_${usuario.id}`,
        JSON.stringify(notificaciones.slice(0, 50)), // Mantener solo las últimas 50
      );
    }
  }, [notificaciones, usuario]);

  // Inicializar socket para notificaciones
  useEffect(() => {
    const token = getToken();
    if (!token || !usuario) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:5000";

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket notificaciones conectado");
    });

    // Notificación de nuevo mensaje de chat
    newSocket.on("notificacion_mensaje", (data) => {
      agregarNotificacion({
        tipo: "mensaje",
        titulo: "Nuevo mensaje",
        mensaje: `${data.remitente.nombre}: ${data.mensaje.contenido.substring(0, 50)}...`,
        data: data,
        icono: "💬",
      });
    });

    // Notificación de nuevo pedido (para depósitos y admin)
    newSocket.on("nuevo_pedido", (data) => {
      agregarNotificacion({
        tipo: "pedido",
        titulo: "Nuevo pedido",
        mensaje: `Pedido #${data.numero} recibido`,
        data: data,
        icono: "📦",
      });
    });

    // Notificación de cambio de estado de pedido
    newSocket.on("pedido_actualizado", (data) => {
      agregarNotificacion({
        tipo: "pedido",
        titulo: "Pedido actualizado",
        mensaje: `Pedido #${data.numero} - ${data.estado}`,
        data: data,
        icono: "📋",
      });
    });

    // Notificación de nuevo envío asignado (para fletes)
    newSocket.on("envio_asignado", (data) => {
      agregarNotificacion({
        tipo: "envio",
        titulo: "Nuevo envío asignado",
        mensaje: `Tienes un nuevo envío para entregar`,
        data: data,
        icono: "🚚",
      });
    });

    // Notificación de envío en camino (para clientes)
    newSocket.on("envio_en_camino", (data) => {
      agregarNotificacion({
        tipo: "envio",
        titulo: "¡Tu pedido va en camino!",
        mensaje: `El pedido #${data.numero} está siendo entregado`,
        data: data,
        icono: "🚀",
      });
    });

    // Notificación de envío entregado
    newSocket.on("envio_entregado", (data) => {
      agregarNotificacion({
        tipo: "envio",
        titulo: "Pedido entregado",
        mensaje: `El pedido #${data.numero} ha sido entregado`,
        data: data,
        icono: "✅",
      });
    });

    // Notificación de cuenta activada/desactivada
    newSocket.on("cuenta_estado", (data) => {
      agregarNotificacion({
        tipo: "cuenta",
        titulo: data.activo ? "Cuenta activada" : "Cuenta desactivada",
        mensaje: data.mensaje,
        data: data,
        icono: data.activo ? "✅" : "⚠️",
      });
    });

    // Notificación de stock bajo (para depósitos)
    newSocket.on("stock_bajo", (data) => {
      agregarNotificacion({
        tipo: "stock",
        titulo: "Stock bajo",
        mensaje: `${data.producto} tiene stock bajo (${data.cantidad} unidades)`,
        data: data,
        icono: "⚠️",
      });
    });

    // Notificación genérica
    newSocket.on("notificacion", (data) => {
      agregarNotificacion(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [usuario]);

  // Agregar nueva notificación
  const agregarNotificacion = useCallback((notificacion) => {
    const nuevaNotificacion = {
      id: Date.now().toString(),
      ...notificacion,
      fecha: new Date().toISOString(),
      leida: false,
    };

    setNotificaciones((prev) => [nuevaNotificacion, ...prev]);
    setNoLeidas((prev) => prev + 1);

    // Mostrar notificación del navegador si está permitido
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notificacion.titulo, {
          body: notificacion.mensaje,
          icon: "/favicon.ico",
        });
      }
    }

    // Reproducir sonido de notificación
    playNotificationSound();
  }, []);

  // Reproducir sonido de notificación
  const playNotificationSound = () => {
    if (typeof window !== "undefined") {
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Silenciar error si el navegador bloquea el autoplay
        });
      } catch (e) {
        // Silenciar error
      }
    }
  };

  // Marcar notificación como leída
  const marcarComoLeida = useCallback((id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    setNoLeidas((prev) => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  }, []);

  // Eliminar notificación
  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.leida) {
        setNoLeidas((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Limpiar todas las notificaciones
  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
    setNoLeidas(0);
    if (usuario) {
      localStorage.removeItem(`notificaciones_${usuario.id}`);
    }
  }, [usuario]);

  // Solicitar permiso para notificaciones del navegador
  const solicitarPermisoNotificaciones = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  const value = {
    notificaciones,
    noLeidas,
    agregarNotificacion,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificaciones,
    solicitarPermisoNotificaciones,
  };

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionContext);
  if (!context) {
    throw new Error(
      "useNotificaciones debe usarse dentro de un NotificacionProvider",
    );
  }
  return context;
}
