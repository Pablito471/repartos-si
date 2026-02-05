import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import Pusher from "pusher-js";
import { useAuth } from "./AuthContext";
import { chatService } from "@/services/api";

const ChatContext = createContext(null);

// Verificar si Pusher está configurado
const isPusherConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
};

export function ChatProvider({ children }) {
  const { usuario } = useAuth();
  const [pusher, setPusher] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [conversacion, setConversacion] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(null);
  const channelsRef = useRef([]);

  // Obtener token desde localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Inicializar Pusher
  useEffect(() => {
    const token = getToken();
    if (!token || !usuario) return;

    if (!isPusherConfigured()) {
      console.warn(
        "Pusher no configurado. Configure NEXT_PUBLIC_PUSHER_KEY y NEXT_PUBLIC_PUSHER_CLUSTER",
      );
      return;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    const pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authorizer: (channel) => ({
        authorize: async (socketId, callback) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/pusher/auth`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              },
            );
            const data = await response.json();
            callback(null, data);
          } catch (error) {
            callback(error, null);
          }
        },
      }),
    });

    pusherInstance.connection.bind("connected", () => {
      console.log("Chat: Pusher conectado");
      setConectado(true);
    });

    pusherInstance.connection.bind("disconnected", () => {
      console.log("Chat: Pusher desconectado");
      setConectado(false);
    });

    pusherInstance.connection.bind("error", (error) => {
      console.error("Chat: Error Pusher:", error);
      setConectado(false);
    });

    // Suscribirse a canal personal del usuario
    const userChannel = pusherInstance.subscribe(`private-user-${usuario.id}`);
    channelsRef.current.push(userChannel);

    userChannel.bind("nuevo_mensaje", (mensaje) => {
      setMensajes((prev) => {
        if (prev.find((m) => m.id === mensaje.id)) return prev;
        return [...prev, mensaje];
      });
    });

    userChannel.bind("notificacion_mensaje", (data) => {
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

    setPusher(pusherInstance);

    return () => {
      channelsRef.current.forEach((channel) => {
        channel.unbind_all();
        pusherInstance.unsubscribe(channel.name);
      });
      channelsRef.current = [];
      pusherInstance.disconnect();
    };
  }, [usuario]);

  // Suscribirse a canal de conversación
  const suscribirseAConversacion = useCallback(
    (convId) => {
      if (!pusher || !convId) return;

      const channelName = `private-conversation-${convId}`;
      const existingChannel = channelsRef.current.find(
        (c) => c.name === channelName,
      );
      if (existingChannel) return;

      const channel = pusher.subscribe(channelName);
      channelsRef.current.push(channel);

      channel.bind("nuevo_mensaje", (mensaje) => {
        setMensajes((prev) => {
          if (prev.find((m) => m.id === mensaje.id)) return prev;
          return [...prev, mensaje];
        });
      });

      channel.bind("usuario_escribiendo", (data) => {
        if (data.usuarioId !== usuario?.id) {
          setEscribiendo(data);
        }
      });

      channel.bind("usuario_dejo_escribir", () => {
        setEscribiendo(null);
      });

      channel.bind("mensajes_leidos", (data) => {
        setMensajes((prev) =>
          prev.map((m) =>
            m.conversacionId === data.conversacionId &&
            m.remitenteId === usuario?.id
              ? { ...m, leido: true }
              : m,
          ),
        );
      });
    },
    [pusher, usuario],
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
        suscribirseAConversacion(conv.id);
      }

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
  }, [usuario, suscribirseAConversacion]);

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

      if (conv) {
        suscribirseAConversacion(conv.id);
      }

      try {
        const response = await chatService.getMensajes(conv.id);
        setMensajes(response.data || response || []);
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
      }
    },
    [suscribirseAConversacion],
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

  // Enviar mensaje via API REST (Pusher emitirá en backend)
  const enviarMensaje = useCallback(
    async (contenido) => {
      if (!conversacion || !contenido.trim()) return;

      try {
        await chatService.enviarMensaje(conversacion.id, contenido.trim());
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        throw error;
      }
    },
    [conversacion],
  );

  // Indicar que está escribiendo (no disponible en serverless)
  const indicarEscribiendo = useCallback(() => {
    // No-op en modo serverless
  }, []);

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
    setConversacion(null);
    setMensajes([]);
    setEscribiendo(null);
  }, []);

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
