import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import Icons from "./Icons";

export default function AdminChatWidget() {
  const { usuario } = useAuth();
  const {
    conectado,
    conversaciones,
    conversacion,
    mensajes,
    cargando,
    escribiendo,
    cargarConversaciones,
    seleccionarConversacion,
    enviarMensaje,
    indicarEscribiendo,
    marcarComoLeidos,
    salirConversacion,
  } = useChat();

  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista' o 'chat'
  const mensajesEndRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const esAdmin = usuario?.tipoUsuario === "admin";

  // Cargar conversaciones al abrir
  useEffect(() => {
    if (abierto && esAdmin) {
      cargarConversaciones();
    }
  }, [abierto, esAdmin, cargarConversaciones]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  // Focus en input y marcar como leídos
  useEffect(() => {
    if (conversacion && inputRef.current && vistaActual === "chat") {
      inputRef.current.focus();
      marcarComoLeidos();
    }
  }, [conversacion, vistaActual, marcarComoLeidos]);

  // Solo mostrar para admin
  if (!usuario || !esAdmin) {
    return null;
  }

  // Filtrar conversaciones
  const conversacionesFiltradas = conversaciones.filter(
    (c) =>
      c.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  // Contar no leídos
  const totalNoLeidos = conversaciones.reduce(
    (acc, c) => acc + (c.mensajesNoLeidosAdmin || 0),
    0,
  );

  const handleSeleccionarConversacion = (conv) => {
    seleccionarConversacion(conv);
    setVistaActual("chat");
  };

  const handleVolverALista = () => {
    salirConversacion();
    setVistaActual("lista");
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || enviando) return;

    setEnviando(true);
    try {
      await enviarMensaje(mensaje);
      setMensaje("");
      indicarEscribiendo(false);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
    setEnviando(false);
  };

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
    indicarEscribiendo(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      indicarEscribiendo(false);
    }, 2000);
  };

  const formatHora = (fecha) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const hoy = new Date();
    const fechaMensaje = new Date(fecha);

    if (fechaMensaje.toDateString() === hoy.toDateString()) {
      return "Hoy";
    }

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaMensaje.toDateString() === ayer.toDateString()) {
      return "Ayer";
    }

    return fechaMensaje.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    });
  };

  const getTipoUsuarioColor = (tipo) => {
    switch (tipo) {
      case "cliente":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "deposito":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "flete":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {abierto ? (
          <Icons.X className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : (
          <>
            <Icons.ChatMultiple className="w-6 h-6 sm:w-7 sm:h-7" />
            {totalNoLeidos > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel del chat */}
      {abierto && (
        <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 z-50 w-[calc(100vw-16px)] sm:w-96 md:w-[450px] h-[70vh] sm:h-[500px] max-h-[calc(100vh-120px)] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          {/* Vista de lista de conversaciones */}
          {vistaActual === "lista" && (
            <>
              {/* Header */}
              <div className="bg-primary-600 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.ChatMultiple className="w-5 h-5" />
                    <span className="font-semibold">Chat de Soporte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conectado ? (
                      <span className="text-xs bg-green-500/30 px-2 py-0.5 rounded-full">
                        En línea
                      </span>
                    ) : (
                      <span className="text-xs bg-red-500/30 px-2 py-0.5 rounded-full">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Búsqueda */}
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
                <div className="relative">
                  <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Lista de conversaciones */}
              <div className="flex-1 overflow-y-auto">
                {cargando ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  </div>
                ) : conversacionesFiltradas.length === 0 ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 px-4">
                    <Icons.ChatMultiple className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay conversaciones</p>
                  </div>
                ) : (
                  conversacionesFiltradas.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSeleccionarConversacion(conv)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors border-b border-neutral-100 dark:border-neutral-700/50 ${
                        conversacion?.id === conv.id
                          ? "bg-primary-50 dark:bg-primary-900/20"
                          : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        {conv.usuario?.foto ? (
                          <Image
                            src={conv.usuario.foto}
                            alt={conv.usuario.nombre || "Usuario"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Icons.User className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-neutral-800 dark:text-neutral-100 truncate">
                            {conv.usuario?.nombre || "Usuario"}
                          </span>
                          <span className="text-[10px] text-neutral-400 flex-shrink-0">
                            {formatFecha(conv.ultimoMensajeFecha)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${getTipoUsuarioColor(
                            conv.usuario?.tipoUsuario,
                          )}`}
                        >
                          {conv.usuario?.tipoUsuario}
                        </span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-1">
                          {conv.ultimoMensaje || "Sin mensajes"}
                        </p>
                      </div>
                      {conv.mensajesNoLeidosAdmin > 0 && (
                        <span className="w-5 h-5 bg-primary-500 text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.mensajesNoLeidosAdmin}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Vista de chat */}
          {vistaActual === "chat" && conversacion && (
            <>
              {/* Header del chat */}
              <div className="bg-primary-600 text-white px-3 py-2 flex items-center gap-2">
                <button
                  onClick={handleVolverALista}
                  className="p-1 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <Icons.ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden relative">
                  {conversacion.usuario?.foto ? (
                    <Image
                      src={conversacion.usuario.foto}
                      alt={conversacion.usuario.nombre || "Usuario"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Icons.User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {conversacion.usuario?.nombre}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${getTipoUsuarioColor(
                      conversacion.usuario?.tipoUsuario,
                    )}`}
                  >
                    {conversacion.usuario?.tipoUsuario}
                  </span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-neutral-50 dark:bg-neutral-900">
                {cargando ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                    <Icons.Chat className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay mensajes</p>
                  </div>
                ) : (
                  mensajes.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.remitenteId === usuario.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          msg.remitenteId === usuario.id
                            ? "bg-primary-600 text-white"
                            : "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.contenido}
                        </p>
                        <div
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            msg.remitenteId === usuario.id
                              ? "text-primary-200 justify-end"
                              : "text-neutral-400"
                          }`}
                        >
                          <span>{formatHora(msg.createdAt)}</span>
                          {msg.remitenteId === usuario.id && (
                            <span className={msg.leido ? "text-sky-400" : ""}>
                              {msg.leido ? "✓✓" : msg.entregado ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Indicador de escribiendo */}
                {escribiendo && escribiendo.usuarioId !== usuario.id && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-neutral-700 rounded-lg px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></span>
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={mensajesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleEnviar}
                className="p-2 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={mensaje}
                    onChange={handleInputChange}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-full bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={!conectado || enviando}
                  />
                  <button
                    type="submit"
                    disabled={!mensaje.trim() || !conectado || enviando}
                    className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    {enviando ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Icons.Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
