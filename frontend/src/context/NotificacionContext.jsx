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

const NotificacionContext = createContext(null);

// URL del socket (sin /api)
const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return apiUrl.replace("/api", "");
};

// Prioridades de notificaciones
export const PRIORIDADES = {
  BAJA: "baja",
  NORMAL: "normal",
  ALTA: "alta",
  URGENTE: "urgente",
};

// Categorias de notificaciones
export const CATEGORIAS = {
  TODAS: "todas",
  PEDIDOS: "pedido",
  ENVIOS: "envio",
  MENSAJES: "mensaje",
  STOCK: "stock",
  SISTEMA: "sistema",
};

export function NotificacionProvider({ children }) {
  const { usuario } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState(CATEGORIAS.TODAS);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);
  const [vibracionHabilitada, setVibracionHabilitada] = useState(true);

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Contexto de audio para generar sonidos
  const audioContextRef = useRef(null);
  const beepAudioRef = useRef(null);
  const audioInicializadoRef = useRef(false);

  // Inicializar audio (llamar en primera interacción del usuario)
  const inicializarAudio = useCallback(async () => {
    if (typeof window === "undefined" || audioInicializadoRef.current) return;

    try {
      // Crear AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Reanudar si está suspendido
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Crear elemento Audio como fallback
      if (!beepAudioRef.current) {
        beepAudioRef.current = new Audio("/beep.wav");
        beepAudioRef.current.volume = 0.8;
        // Cargar el audio
        beepAudioRef.current.load();
      }

      audioInicializadoRef.current = true;
    } catch (e) {
      console.warn("Error inicializando audio:", e);
    }
  }, []);

  // Escuchar eventos de interacción para inicializar audio
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleInteraction = () => {
      inicializarAudio();
    };

    // Eventos que indican interacción del usuario
    const eventos = ["click", "touchstart", "keydown"];
    eventos.forEach((e) =>
      window.addEventListener(e, handleInteraction, {
        once: true,
        passive: true,
      }),
    );

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, handleInteraction));
    };
  }, [inicializarAudio]);

  // Obtener o crear AudioContext
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    return audioContextRef.current;
  }, []);

  // Reproducir tono con Web Audio API
  const playTone = useCallback(
    async (frequency, duration, volume = 0.3, type = "sine") => {
      const ctx = getAudioContext();

      // Si no hay contexto, intentar con Audio HTML
      if (!ctx) {
        if (beepAudioRef.current) {
          try {
            beepAudioRef.current.currentTime = 0;
            await beepAudioRef.current.play();
          } catch (e) {
            console.warn("Error reproduciendo audio fallback:", e);
          }
        }
        return;
      }

      // Reanudar contexto si está suspendido (crítico para móviles)
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
      } catch (e) {
        // Si falla, intentar con Audio HTML
        if (beepAudioRef.current) {
          try {
            beepAudioRef.current.currentTime = 0;
            await beepAudioRef.current.play();
          } catch (e2) {
            console.warn("Error reproduciendo audio fallback:", e2);
          }
        }
        return;
      }

      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Fade in y fade out suave
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
      } catch (e) {
        // Fallback a Audio HTML si Web Audio falla
        if (beepAudioRef.current) {
          try {
            beepAudioRef.current.currentTime = 0;
            await beepAudioRef.current.play();
          } catch (e2) {
            console.warn("Error reproduciendo audio fallback:", e2);
          }
        }
      }
    },
    [getAudioContext],
  );

  // Reproducir sonido segun prioridad y tipo
  const playNotificationSound = useCallback(
    (prioridad = PRIORIDADES.NORMAL, tipo = "default") => {
      if (!sonidoHabilitado || typeof window === "undefined") return;

      try {
        // Diferentes patrones de sonido según prioridad
        switch (prioridad) {
          case PRIORIDADES.URGENTE:
            // Sonido urgente: tres tonos ascendentes rápidos
            playTone(880, 0.15, 0.5, "square");
            setTimeout(() => playTone(1100, 0.15, 0.5, "square"), 150);
            setTimeout(() => playTone(1320, 0.2, 0.6, "square"), 300);
            break;

          case PRIORIDADES.ALTA:
            // Sonido alto: dos tonos ascendentes
            playTone(660, 0.15, 0.4, "sine");
            setTimeout(() => playTone(880, 0.2, 0.4, "sine"), 150);
            break;

          case PRIORIDADES.NORMAL:
            // Sonido normal según tipo
            if (tipo === "mensaje") {
              // Sonido suave para mensajes
              playTone(523, 0.1, 0.25, "sine");
              setTimeout(() => playTone(659, 0.15, 0.25, "sine"), 100);
            } else if (tipo === "pedido") {
              // Sonido distintivo para pedidos
              playTone(440, 0.1, 0.3, "triangle");
              setTimeout(() => playTone(554, 0.1, 0.3, "triangle"), 100);
              setTimeout(() => playTone(659, 0.15, 0.3, "triangle"), 200);
            } else {
              // Sonido genérico
              playTone(587, 0.15, 0.3, "sine");
            }
            break;

          case PRIORIDADES.BAJA:
            // Sonido sutil
            playTone(440, 0.1, 0.15, "sine");
            break;

          default:
            playTone(523, 0.15, 0.25, "sine");
        }

        // Vibración para notificaciones urgentes
        if (
          vibracionHabilitada &&
          "vibrate" in navigator &&
          (prioridad === PRIORIDADES.URGENTE || prioridad === PRIORIDADES.ALTA)
        ) {
          const patron =
            prioridad === PRIORIDADES.URGENTE
              ? [200, 100, 200, 100, 200]
              : [150, 100, 150];
          navigator.vibrate(patron);
        }
      } catch (e) {
        // Silenciar errores de audio
        console.warn("Error al reproducir sonido:", e);
      }
    },
    [sonidoHabilitado, vibracionHabilitada, playTone],
  );

  // Agregar notificacion
  const agregarNotificacionFn = useCallback(
    (notificacion) => {
      const prioridad = notificacion.prioridad || PRIORIDADES.NORMAL;
      const nuevaNotificacion = {
        id:
          Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9),
        ...notificacion,
        fecha: new Date().toISOString(),
        leida: false,
        prioridad,
        animacion: true,
      };

      setNotificaciones((prev) => {
        // Evitar duplicados
        const cincoSegundosAtras = Date.now() - 5000;
        const existeDuplicado = prev.some(
          (n) =>
            n.titulo === nuevaNotificacion.titulo &&
            n.mensaje === nuevaNotificacion.mensaje &&
            new Date(n.fecha).getTime() > cincoSegundosAtras,
        );
        if (existeDuplicado) return prev;

        const nuevas = [nuevaNotificacion, ...prev];
        return nuevas
          .sort((a, b) => {
            const prioridadOrden = {
              [PRIORIDADES.URGENTE]: 4,
              [PRIORIDADES.ALTA]: 3,
              [PRIORIDADES.NORMAL]: 2,
              [PRIORIDADES.BAJA]: 1,
            };
            const prioA = prioridadOrden[a.prioridad] || 2;
            const prioB = prioridadOrden[b.prioridad] || 2;
            if (prioA !== prioB) return prioB - prioA;
            return new Date(b.fecha) - new Date(a.fecha);
          })
          .slice(0, 100);
      });

      setNoLeidas((prev) => prev + 1);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const notification = new Notification(notificacion.titulo, {
          body: notificacion.mensaje,
          icon: "/favicon.ico",
          tag: nuevaNotificacion.id,
          requireInteraction: prioridad === PRIORIDADES.URGENTE,
        });
        const tiemposCierre = {
          [PRIORIDADES.BAJA]: 3000,
          [PRIORIDADES.NORMAL]: 5000,
          [PRIORIDADES.ALTA]: 8000,
          [PRIORIDADES.URGENTE]: 15000,
        };
        setTimeout(
          () => notification.close(),
          tiemposCierre[prioridad] || 5000,
        );
      }

      playNotificationSound(prioridad, notificacion.tipo || "default");

      setTimeout(() => {
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === nuevaNotificacion.id ? { ...n, animacion: false } : n,
          ),
        );
      }, 500);
    },
    [playNotificationSound],
  );

  const agregarNotificacionRef = useRef(agregarNotificacionFn);
  agregarNotificacionRef.current = agregarNotificacionFn;

  const agregarNotificacion = useCallback((notificacion) => {
    agregarNotificacionRef.current(notificacion);
  }, []);

  // Cargar desde localStorage
  useEffect(() => {
    if (usuario) {
      const saved = localStorage.getItem("notificaciones_" + usuario.id);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotificaciones(parsed.map((n) => ({ ...n, animacion: false })));
          setNoLeidas(parsed.filter((n) => !n.leida).length);
        } catch (e) {
          // Error al parsear
        }
      }
      const config = localStorage.getItem("notif_config_" + usuario.id);
      if (config) {
        try {
          const { sonido, vibracion } = JSON.parse(config);
          if (typeof sonido === "boolean") setSonidoHabilitado(sonido);
          if (typeof vibracion === "boolean") setVibracionHabilitada(vibracion);
        } catch (e) {
          // Error al parsear config
        }
      }
    }
  }, [usuario]);

  // Guardar en localStorage (debounced)
  useEffect(() => {
    if (!usuario) return;
    const timeoutId = setTimeout(() => {
      if (notificaciones.length > 0) {
        localStorage.setItem(
          "notificaciones_" + usuario.id,
          JSON.stringify(notificaciones.slice(0, 50)),
        );
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [notificaciones, usuario]);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(
        "notif_config_" + usuario.id,
        JSON.stringify({
          sonido: sonidoHabilitado,
          vibracion: vibracionHabilitada,
        }),
      );
    }
  }, [sonidoHabilitado, vibracionHabilitada, usuario]);

  // Socket.io
  useEffect(() => {
    const token = getToken();
    if (!token || !usuario) return;

    const socketUrl = getSocketUrl();
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () =>
      console.log("Notificaciones: Socket.io conectado"),
    );
    socketInstance.on("disconnect", () =>
      console.log("Notificaciones: Socket.io desconectado"),
    );
    socketInstance.on("connect_error", (error) =>
      console.error("Notificaciones: Error:", error.message),
    );

    socketInstance.on("notificacion_mensaje", (data) => {
      const remitente = data.remitente?.nombre || "Usuario";
      const contenido = (data.mensaje?.contenido || "").substring(0, 50);
      agregarNotificacionRef.current({
        tipo: "mensaje",
        titulo: "Nuevo mensaje",
        mensaje: remitente + ": " + contenido + "...",
        data,
        icono: "chat",
        prioridad: PRIORIDADES.NORMAL,
      });
    });

    socketInstance.on("nuevo_pedido", (data) => {
      agregarNotificacionRef.current({
        tipo: "pedido",
        titulo: "Nuevo pedido",
        mensaje: "Pedido #" + data.numero + " recibido",
        data,
        icono: "pedido",
        prioridad: PRIORIDADES.ALTA,
        accion: { tipo: "ver_pedido", id: data.id },
      });
      window.dispatchEvent(
        new CustomEvent("socket:nuevo_pedido", { detail: data }),
      );
    });

    socketInstance.on("pedido_actualizado", (data) => {
      const estadosTexto = {
        pendiente: "esta pendiente",
        preparando: "se esta preparando",
        listo: "esta listo para envio",
        enviado: "va en camino",
        entregado: "ha sido entregado",
        cancelado: "fue cancelado",
      };
      agregarNotificacionRef.current({
        tipo: "pedido",
        titulo: "Pedido actualizado",
        mensaje:
          "Pedido #" +
          data.numero +
          " " +
          (estadosTexto[data.estado] || data.estado),
        data,
        icono: data.estado === "entregado" ? "check" : "pedido",
        prioridad:
          data.estado === "cancelado" ? PRIORIDADES.ALTA : PRIORIDADES.NORMAL,
        accion: { tipo: "ver_pedido", id: data.id },
      });
      window.dispatchEvent(
        new CustomEvent("socket:pedido_actualizado", { detail: data }),
      );
    });

    socketInstance.on("envio_asignado", (data) => {
      agregarNotificacionRef.current({
        tipo: "envio",
        titulo: "Nuevo envio asignado",
        mensaje: "Tienes un nuevo envio para entregar",
        data,
        icono: "truck",
        prioridad: PRIORIDADES.ALTA,
        accion: { tipo: "ver_envio", id: data.id },
      });
      window.dispatchEvent(
        new CustomEvent("socket:envio_asignado", { detail: data }),
      );
    });

    socketInstance.on("envio_en_camino", (data) => {
      agregarNotificacionRef.current({
        tipo: "envio",
        titulo: "Tu pedido va en camino!",
        mensaje: "El pedido #" + data.numero + " esta siendo entregado",
        data,
        icono: "truck",
        prioridad: PRIORIDADES.ALTA,
      });
      window.dispatchEvent(
        new CustomEvent("socket:envio_en_camino", { detail: data }),
      );
    });

    socketInstance.on("envio_entregado", (data) => {
      const stockMsg = data.stockActualizado ? ". Stock actualizado" : "";
      agregarNotificacionRef.current({
        tipo: "envio",
        titulo: "Pedido entregado",
        mensaje: "El pedido #" + data.numero + " ha sido entregado" + stockMsg,
        data,
        icono: "check",
        prioridad: PRIORIDADES.NORMAL,
      });
      window.dispatchEvent(
        new CustomEvent("socket:envio_entregado", { detail: data }),
      );
    });

    socketInstance.on("envio_entregado_deposito", (data) => {
      agregarNotificacionRef.current({
        tipo: "envio",
        titulo: "Envio completado",
        mensaje: "El pedido #" + data.numero + " fue entregado exitosamente",
        data,
        icono: "check",
        prioridad: PRIORIDADES.NORMAL,
      });
      window.dispatchEvent(
        new CustomEvent("socket:envio_entregado_deposito", { detail: data }),
      );
    });

    socketInstance.on("cuenta_estado", (data) => {
      agregarNotificacionRef.current({
        tipo: "sistema",
        titulo: data.activo ? "Cuenta activada" : "Cuenta desactivada",
        mensaje: data.mensaje,
        data,
        icono: data.activo ? "check" : "warning",
        prioridad: data.activo ? PRIORIDADES.NORMAL : PRIORIDADES.URGENTE,
      });
    });

    socketInstance.on("stock_bajo", (data) => {
      agregarNotificacionRef.current({
        tipo: "stock",
        titulo: "Stock bajo",
        mensaje:
          data.producto + " tiene stock bajo (" + data.cantidad + " unidades)",
        data,
        icono: "warning",
        prioridad: PRIORIDADES.ALTA,
      });
    });

    socketInstance.on("videollamada_entrante", (data) => {
      const llamante = data.remitente?.nombre || "Usuario";
      agregarNotificacionRef.current({
        tipo: "mensaje",
        titulo: "Videollamada entrante",
        mensaje: llamante + " te esta llamando",
        data,
        icono: "video",
        prioridad: PRIORIDADES.URGENTE,
        accion: { tipo: "contestar_llamada", data },
      });
    });

    socketInstance.on("notificacion", (data) => {
      agregarNotificacionRef.current({
        ...data,
        prioridad: data.prioridad || PRIORIDADES.NORMAL,
      });
      if (data.tipo === "info" && data.datos?.envioId && data.datos?.pedidoId) {
        window.dispatchEvent(
          new CustomEvent("socket:envio_en_camino_deposito", {
            detail: data.datos,
          }),
        );
      }
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [usuario]);

  const marcarComoLeida = useCallback((id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    setNoLeidas((prev) => Math.max(0, prev - 1));
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  }, []);

  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => {
      const notif = prev.find((n) => n.id === id);
      if (notif && !notif.leida) setNoLeidas((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
    setNoLeidas(0);
    if (usuario) localStorage.removeItem("notificaciones_" + usuario.id);
  }, [usuario]);

  const getNotificacionesFiltradas = useCallback(() => {
    if (filtroCategoria === CATEGORIAS.TODAS) return notificaciones;
    return notificaciones.filter((n) => n.tipo === filtroCategoria);
  }, [notificaciones, filtroCategoria]);

  const getConteoPorCategoria = useCallback(
    () => ({
      todas: notificaciones.filter((n) => !n.leida).length,
      pedido: notificaciones.filter((n) => n.tipo === "pedido" && !n.leida)
        .length,
      envio: notificaciones.filter((n) => n.tipo === "envio" && !n.leida)
        .length,
      mensaje: notificaciones.filter((n) => n.tipo === "mensaje" && !n.leida)
        .length,
      stock: notificaciones.filter((n) => n.tipo === "stock" && !n.leida)
        .length,
      sistema: notificaciones.filter((n) => n.tipo === "sistema" && !n.leida)
        .length,
    }),
    [notificaciones],
  );

  const solicitarPermisoNotificaciones = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return (await Notification.requestPermission()) === "granted";
    }
    return false;
  }, []);

  const toggleSonido = useCallback(() => setSonidoHabilitado((p) => !p), []);
  const toggleVibracion = useCallback(
    () => setVibracionHabilitada((p) => !p),
    [],
  );

  const value = {
    notificaciones,
    noLeidas,
    filtroCategoria,
    sonidoHabilitado,
    vibracionHabilitada,
    agregarNotificacion,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificaciones,
    solicitarPermisoNotificaciones,
    setFiltroCategoria,
    getNotificacionesFiltradas,
    getConteoPorCategoria,
    toggleSonido,
    toggleVibracion,
    playNotificationSound,
    inicializarAudio,
    PRIORIDADES,
    CATEGORIAS,
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
