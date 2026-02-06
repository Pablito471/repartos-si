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

// Configuración de ICE servers para WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
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

  // Estados de videollamada
  const [enLlamada, setEnLlamada] = useState(false);
  const [llamadaEntrante, setLlamadaEntrante] = useState(null);
  const [llamadaSaliente, setLlamadaSaliente] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [videoActivo, setVideoActivo] = useState(true);
  const [usuarioEnLlamada, setUsuarioEnLlamada] = useState(null);

  // Refs para WebRTC
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // Ref para la conversación actual (para acceder sincrónicamente en listeners)
  const conversacionRef = useRef(null);

  // Mantener el ref sincronizado con el estado
  useEffect(() => {
    conversacionRef.current = conversacion;
  }, [conversacion]);

  // Obtener token desde localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Limpiar recursos de videollamada
  const limpiarLlamada = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setEnLlamada(false);
    setLlamadaEntrante(null);
    setLlamadaSaliente(false);
    setUsuarioEnLlamada(null);
    setMicrofonoActivo(true);
    setVideoActivo(true);
  }, [localStream]);

  // Crear peer connection
  const crearPeerConnection = useCallback(
    (usuarioRemotoId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            usuarioDestinoId: usuarioRemotoId,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "disconnected" ||
          pc.iceConnectionState === "failed"
        ) {
          limpiarLlamada();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [socket, limpiarLlamada],
  );

  // Iniciar videollamada
  const iniciarLlamada = useCallback(
    async (usuarioDestinoId, usuarioDestinoNombre) => {
      if (!socket || !conversacion) return;

      try {
        // Obtener stream local
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        setLlamadaSaliente(true);
        setUsuarioEnLlamada({
          id: usuarioDestinoId,
          nombre: usuarioDestinoNombre,
        });

        // Crear peer connection
        const pc = crearPeerConnection(usuarioDestinoId);

        // Agregar tracks al peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Crear oferta
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Enviar solicitud de llamada
        socket.emit("videollamada_solicitar", {
          conversacionId: conversacion.id,
          usuarioDestinoId,
          offer: pc.localDescription,
          nombreLlamante: usuario?.nombre,
        });
      } catch (error) {
        console.error("Error al iniciar videollamada:", error);
        limpiarLlamada();

        if (error.name === "NotAllowedError") {
          alert(
            "Se necesitan permisos de cámara y micrófono para realizar videollamadas",
          );
        }
      }
    },
    [socket, conversacion, usuario, crearPeerConnection, limpiarLlamada],
  );

  // Aceptar videollamada entrante
  const aceptarLlamada = useCallback(async () => {
    if (!socket || !llamadaEntrante) return;

    try {
      // Obtener stream local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setEnLlamada(true);

      // Crear peer connection
      const pc = crearPeerConnection(llamadaEntrante.usuarioId);

      // Agregar tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Establecer descripción remota (la oferta)
      await pc.setRemoteDescription(
        new RTCSessionDescription(llamadaEntrante.offer),
      );

      // Procesar candidatos pendientes
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      // Crear respuesta
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Enviar aceptación
      socket.emit("videollamada_aceptar", {
        conversacionId: llamadaEntrante.conversacionId,
        usuarioDestinoId: llamadaEntrante.usuarioId,
        answer: pc.localDescription,
      });

      setUsuarioEnLlamada({
        id: llamadaEntrante.usuarioId,
        nombre: llamadaEntrante.nombreLlamante,
      });
      setLlamadaEntrante(null);
    } catch (error) {
      console.error("Error al aceptar videollamada:", error);
      limpiarLlamada();
    }
  }, [socket, llamadaEntrante, crearPeerConnection, limpiarLlamada]);

  // Rechazar videollamada entrante
  const rechazarLlamada = useCallback(() => {
    if (!socket || !llamadaEntrante) return;

    socket.emit("videollamada_rechazar", {
      conversacionId: llamadaEntrante.conversacionId,
      usuarioDestinoId: llamadaEntrante.usuarioId,
    });

    setLlamadaEntrante(null);
  }, [socket, llamadaEntrante]);

  // Colgar videollamada
  const colgarLlamada = useCallback(() => {
    if (!socket) return;

    if (usuarioEnLlamada) {
      socket.emit("videollamada_terminar", {
        conversacionId: conversacion?.id,
        usuarioDestinoId: usuarioEnLlamada.id,
      });
    }

    limpiarLlamada();
  }, [socket, conversacion, usuarioEnLlamada, limpiarLlamada]);

  // Toggle micrófono
  const toggleMicrofono = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicrofonoActivo(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoActivo(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Inicializar Socket.io
  useEffect(() => {
    const token = getToken();
    if (!token || !usuario) return;

    const socketUrl = getSocketUrl();
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      setConectado(true);
    });

    socketInstance.on("disconnect", () => {
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

      // Solo marcar como leído si:
      // 1. El mensaje es para mí
      // 2. Estoy viendo esa conversación activamente
      if (
        mensaje.destinatarioId === usuario?.id &&
        conversacionRef.current?.id === mensaje.conversacionId
      ) {
        socketInstance.emit("marcar_leidos", mensaje.conversacionId);
      }
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
            ? { ...m, leido: true, entregado: true }
            : m,
        ),
      );
    });

    // Mensaje entregado (uno solo)
    socketInstance.on("mensaje_entregado", (data) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === data.mensajeId ? { ...m, entregado: true } : m,
        ),
      );
    });

    // Mensajes entregados (varios)
    socketInstance.on("mensajes_entregados", (data) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.conversacionId === data.conversacionId &&
          m.remitenteId === usuario?.id
            ? { ...m, entregado: true }
            : m,
        ),
      );
    });

    // === EVENTOS DE VIDEOLLAMADA ===

    // Videollamada entrante
    socketInstance.on("videollamada_entrante", (data) => {
      setLlamadaEntrante(data);
    });

    // Videollamada aceptada
    socketInstance.on("videollamada_aceptada", async (data) => {
      try {
        if (peerConnectionRef.current && data.answer) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );

          // Procesar candidatos pendientes
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          }
          pendingCandidatesRef.current = [];

          setEnLlamada(true);
          setLlamadaSaliente(false);
        }
      } catch (error) {
        console.error("Error al procesar aceptación de llamada:", error);
      }
    });

    // Videollamada rechazada
    socketInstance.on("videollamada_rechazada", () => {
      alert("La llamada fue rechazada");
      limpiarLlamada();
    });

    // Videollamada terminada
    socketInstance.on("videollamada_terminada", () => {
      limpiarLlamada();
    });

    // ICE candidate recibido
    socketInstance.on("webrtc_ice_candidate", async (data) => {
      try {
        if (
          peerConnectionRef.current &&
          peerConnectionRef.current.remoteDescription
        ) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        } else {
          // Guardar para procesar después
          pendingCandidatesRef.current.push(data.candidate);
        }
      } catch (error) {
        console.error("Error al agregar ICE candidate:", error);
      }
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
        // Marcar mensajes como entregados cuando entramos a la conversación
        socket.emit("marcar_entregados", convId);
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
      // Emitir evento de socket para actualización en tiempo real
      if (socket) {
        socket.emit("marcar_leidos", conversacion.id);
      }

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
  }, [conversacion, usuario, socket]);

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
    // Chat básico
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
    // Videollamadas
    enLlamada,
    llamadaEntrante,
    llamadaSaliente,
    localStream,
    remoteStream,
    microfonoActivo,
    videoActivo,
    usuarioEnLlamada,
    iniciarLlamada,
    aceptarLlamada,
    rechazarLlamada,
    colgarLlamada,
    toggleMicrofono,
    toggleVideo,
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
