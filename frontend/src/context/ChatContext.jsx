import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { chatService } from "@/services/api";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { usuario } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [conversacion, setConversacion] = useState(null);
  const [conversaciones, setConversaciones] = useState([]); // Para admin
  const [mensajes, setMensajes] = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(null);

  // Obtener token desde localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Inicializar socket
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
      console.log("Socket conectado");
      setConectado(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket desconectado");
      setConectado(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Error de conexión socket:", error.message);
      setConectado(false);
    });

    // Nuevo mensaje
    newSocket.on("nuevo_mensaje", (mensaje) => {
      setMensajes((prev) => {
        // Evitar duplicados
        if (prev.find((m) => m.id === mensaje.id)) return prev;
        return [...prev, mensaje];
      });
    });

    // Notificación de mensaje
    newSocket.on("notificacion_mensaje", (data) => {
      // Actualizar contador de no leídos si no estamos en la conversación
      if (!conversacion || conversacion.id !== data.conversacionId) {
        setNoLeidos((prev) => prev + 1);
      }

      // Actualizar lista de conversaciones (para admin)
      if (usuario.tipoUsuario === "admin") {
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === data.conversacionId
              ? {
                  ...c,
                  ultimoMensaje: data.mensaje.contenido,
                  ultimoMensajeFecha: new Date().toISOString(),
                  mensajesNoLeidosAdmin: (c.mensajesNoLeidosAdmin || 0) + 1,
                }
              : c,
          ),
        );
      }
    });

    // Usuario escribiendo
    newSocket.on("usuario_escribiendo", (data) => {
      setEscribiendo(data);
    });

    newSocket.on("usuario_dejo_escribir", () => {
      setEscribiendo(null);
    });

    // Mensajes leídos
    newSocket.on("mensajes_leidos", (data) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.conversacionId === data.conversacionId &&
          m.remitenteId === usuario.id
            ? { ...m, leido: true }
            : m,
        ),
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [usuario]);

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

      // Unirse a la sala de la conversación
      if (socket && conv) {
        socket.emit("unirse_conversacion", conv.id);
      }

      // Cargar mensajes existentes
      if (conv) {
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
  }, [usuario, socket]);

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
      setConversacion(conv);
      setMensajes([]);

      if (socket && conv) {
        socket.emit("unirse_conversacion", conv.id);
      }

      // Cargar mensajes
      try {
        const response = await chatService.getMensajes(conv.id);
        setMensajes(response.data || response || []);
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
      }
    },
    [socket],
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
      if (!socket || !conversacion || !contenido.trim()) return;

      // Enviar via socket para tiempo real
      socket.emit("enviar_mensaje", {
        conversacionId: conversacion.id,
        contenido: contenido.trim(),
        tipo: "texto",
      });
    },
    [socket, conversacion],
  );

  // Indicar que está escribiendo
  const indicarEscribiendo = useCallback(
    (escribiendo) => {
      if (!socket || !conversacion) return;

      if (escribiendo) {
        socket.emit("escribiendo", { conversacionId: conversacion.id });
      } else {
        socket.emit("dejo_escribir", { conversacionId: conversacion.id });
      }
    },
    [socket, conversacion],
  );

  // Marcar mensajes como leídos
  const marcarComoLeidos = useCallback(() => {
    if (!socket || !conversacion) return;

    socket.emit("marcar_leidos", conversacion.id);
    setNoLeidos(0);

    // Actualizar lista de conversaciones (para admin)
    if (usuario?.tipoUsuario === "admin") {
      setConversaciones((prev) =>
        prev.map((c) =>
          c.id === conversacion.id ? { ...c, mensajesNoLeidosAdmin: 0 } : c,
        ),
      );
    }
  }, [socket, conversacion, usuario]);

  // Salir de la conversación
  const salirConversacion = useCallback(() => {
    if (socket && conversacion) {
      socket.emit("salir_conversacion", conversacion.id);
    }
    setConversacion(null);
    setMensajes([]);
    setEscribiendo(null);
  }, [socket, conversacion]);

  const value = {
    socket,
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
