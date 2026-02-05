import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { chatService } from "@/services/api";

const ChatContext = createContext(null);

// URL del socket (sin /api)
const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return apiUrl.replace("/api", "");
};

export function ChatProvider({ children }) {
  const { usuario } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [conversacion, setConversacion] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(null);
  const escribiendoTimeoutRef = useRef(null);

  // Obtener token desde localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Inicializar Socket.io
  useEffect(() => {
    const token = getToken();
    if (!token || !usuario) return;

    const socketUrl = getSocketUrl();
    console.log("Chat: Conectando a Socket.io en", socketUrl);

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Chat: Socket.io conectado");
      setConectado(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Chat: Socket.io desconectado");
      setConectado(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Chat: Error de conexión Socket.io:", error.message);
      setConectado(false);
    });

    // Escuchar nuevos mensajes
    socketInstance.on("nuevo_mensaje", (mensaje) => {
      setMensajes((prev) => {
        if (prev.find((m) => m.id === mensaje.id)) return prev;
        return [...prev, mensaje];
      });
    });

    // Notificación de mensaje cuando no está en la conversación
    socketInstance.on("notificacion_mensaje", (data) => {
      if (!conversacion || conversacion.id !== data.conversacionId) {
        setNoLeidos((prev) => prev + 1);
      }

      if (usuario.tipoUsuario === "admin") {
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === data.conversacionId
              ? {
                  ...c,
                  ultimoMensaje: data.mensaje?.contenido || "",
                  ultimoMensajeFecha: new Date().toISOString(),
                  mensajesNoLeidosAdmin: (c.mensajesNoLeidosAdmin || 0) + 1,
                }
              : c,
          ),
        );
      }
    });

    // Usuario escribiendo
    socketInstance.on("usuario_escribiendo", (data) => {
      if (data.usuarioId !== usuario?.id) {
        setEscribiendo(data);
        
        // Limpiar escribiendo después de 3 segundos
        if (escribiendoTimeoutRef.current) {
          clearTimeout(escribiendoTimeoutRef.current);
        }
        escribiendoTimeoutRef.current = setTimeout(() => {
          setEscribiendo(null);
        }, 3000);
      }
    });

    // Usuario dejó de escribir
    socketInstance.on("usuario_dejo_escribir", () => {
      setEscribiendo(null);
    });

    // Mensajes leídos
    socketInstance.on("mensajes_leidos", (data) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.conversacionId === data.conversacionId &&
          m.remitenteId === usuario?.id
            ? { ...m, leido: true }
            : m,
        ),
      );
    });

    setSocket(socketInstance);

    return () => {
      if (escribiendoTimeoutRef.current) {
        clearTimeout(escribiendoTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, [usuario]);

  // Unirse a sala de conversación
  const unirseAConversacion = useCallback(
    (convId) => {
      if (socket && convId) {
        socket.emit("join_conversacion", convId);
      }
    },
    [socket],
  );

  // Salir de sala de conversación
  const salirDeConversacion = useCallback(
    (convId) => {
      if (socket && convId) {
        socket.emit("leave_conversacion", convId);
      }
    },
    [socket],
  );

  // Cargar cantidad de no leídos
  useEffect(() => {
    if (!usuario) return;

    const cargarNoLeidos = async () => {
      try {
        const response = await chatService.getNoLeidos();
        setNoLeidos(response.data?.totalNoLeidos || 0);
      } catch (error) {
        console.error("Error al cargar no leídos:", error);
      }
    };

    cargarNoLeidos();
  }, [usuario]);

  // Obtener o crear conversación (para usuarios no-admin)
  const iniciarConversacion = useCallback(async () => {
    if (!usuario || usuario.tipoUsuario === "admin") return null;

    setCargando(true);
    try {
      const response = await chatService.getMiConversacion();
      const conv = response.data || response;
      setConversacion(conv);

      if (conv) {
        unirseAConversacion(conv.id);

        try {
          const msgResponse = await chatService.getMensajes(conv.id);
          setMensajes(msgResponse.data || msgResponse || []);
        } catch (error) {
          console.error("Error al cargar mensajes:", error);
        }
      }

      return conv;
    } catch (error) {
      console.error("Error al iniciar conversación:", error);
      return null;
    } finally {
      setCargando(false);
    }
  }, [usuario, unirseAConversacion]);

  // Cargar conversaciones (para admin)
  const cargarConversaciones = useCallback(async () => {
    if (!usuario || usuario.tipoUsuario !== "admin") return;

    setCargando(true);
    try {
      const response = await chatService.getConversaciones();
      setConversaciones(response.data || response || []);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  // Seleccionar conversación (para admin)
  const seleccionarConversacion = useCallback(
    async (conv) => {
      // Salir de la conversación anterior
      if (conversacion) {
        salirDeConversacion(conversacion.id);
      }

      setConversacion(conv);
      setMensajes([]);

      if (conv) {
        unirseAConversacion(conv.id);

        try {
          const response = await chatService.getMensajes(conv.id);
          setMensajes(response.data || response || []);
        } catch (error) {
          console.error("Error al cargar mensajes:", error);
        }
      }
    },
    [conversacion, unirseAConversacion, salirDeConversacion],
  );

  // Cargar mensajes de la conversación actual
  const cargarMensajes = useCallback(async () => {
    if (!conversacion) return;

    try {
      const response = await chatService.getMensajes(conversacion.id);
      setMensajes(response.data || response || []);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  }, [conversacion]);

  // Enviar mensaje
  const enviarMensaje = useCallback(
    async (contenido) => {
      if (!conversacion || !contenido.trim()) return;

      try {
        // Enviar via API REST, el backend emitirá por socket
        await chatService.enviarMensaje(conversacion.id, contenido.trim());
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        throw error;
      }
    },
    [conversacion],
  );

  // Indicar que está escribiendo
  const indicarEscribiendo = useCallback(() => {
    if (socket && conversacion) {
      socket.emit("escribiendo", {
        conversacionId: conversacion.id,
        usuarioId: usuario?.id,
        nombre: usuario?.nombre,
      });
    }
  }, [socket, conversacion, usuario]);

  // Marcar mensajes como leídos
  const marcarComoLeidos = useCallback(async () => {
    if (!conversacion) return;

    try {
      await chatService.marcarLeidos(conversacion.id);
      setNoLeidos(0);

      if (usuario?.tipoUsuario === "admin") {
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === conversacion.id ? { ...c, mensajesNoLeidosAdmin: 0 } : c,
          ),
        );
      }
    } catch (error) {
      console.error("Error al marcar como leídos:", error);
    }
  }, [conversacion, usuario]);

  // Salir de la conversación
  const salirConversacion = useCallback(() => {
    if (conversacion) {
      salirDeConversacion(conversacion.id);
    }
    setConversacion(null);
    setMensajes([]);
    setEscribiendo(null);
  }, [conversacion, salirDeConversacion]);

  const value = {
    conectado,
    conversacion,
    conversaciones,
    mensajes,
    noLeidos,
    cargando,
    escribiendo,
    iniciarConversacion,
    cargarConversaciones,
    seleccionarConversacion,
    cargarMensajes,
    enviarMensaje,
    indicarEscribiendo,
    marcarComoLeidos,
    salirConversacion,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat debe usarse dentro de un ChatProvider");
  }
  return context;
}
