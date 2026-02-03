import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import Icons from "@/components/Icons";

export default function AdminChat() {
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

  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const mensajesEndRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cargar conversaciones al montar
  useEffect(() => {
    if (usuario) {
      cargarConversaciones();
    }
  }, [cargarConversaciones, usuario]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  // Focus en input al seleccionar conversación
  useEffect(() => {
    if (conversacion && inputRef.current) {
      inputRef.current.focus();
      marcarComoLeidos();
    }
  }, [conversacion, marcarComoLeidos]);

  // Si no hay usuario, no renderizar nada (se redirigirá al login)
  if (!usuario) {
    return null;
  }

  // Filtrar conversaciones
  const conversacionesFiltradas = conversaciones.filter(
    (c) =>
      c.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || enviando) return;

    setEnviando(true);
    await enviarMensaje(mensaje);
    setMensaje("");
    indicarEscribiendo(false);
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
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Chat de Soporte
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Gestiona las conversaciones con usuarios
              {conectado ? (
                <span className="ml-2 text-green-500 text-sm">● Conectado</span>
              ) : (
                <span className="ml-2 text-red-500 text-sm">
                  ● Desconectado
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex-1 flex bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden border border-neutral-200 dark:border-neutral-700">
          {/* Lista de conversaciones */}
          <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
            {/* Búsqueda */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {cargando ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : conversacionesFiltradas.length === 0 ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 px-4">
                  <Icons.ChatMultiple className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay conversaciones</p>
                </div>
              ) : (
                conversacionesFiltradas.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => seleccionarConversacion(conv)}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 ${
                      conversacion?.id === conv.id
                        ? "bg-primary-50 dark:bg-primary-900/20"
                        : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {conv.usuario?.foto ? (
                        <img
                          src={conv.usuario.foto}
                          alt={conv.usuario.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icons.User className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                          {conv.usuario?.nombre || "Usuario"}
                        </span>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {formatFecha(conv.ultimoMensajeFecha)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${getTipoUsuarioColor(
                            conv.usuario?.tipoUsuario,
                          )}`}
                        >
                          {conv.usuario?.tipoUsuario}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">
                        {conv.ultimoMensaje || "Sin mensajes"}
                      </p>
                    </div>
                    {conv.mensajesNoLeidosAdmin > 0 && (
                      <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.mensajesNoLeidosAdmin}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Área de chat */}
          <div className="flex-1 flex flex-col">
            {!conversacion ? (
              <div className="flex-1 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                <div className="text-center">
                  <Icons.ChatMultiple className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Selecciona una conversación</p>
                  <p className="text-sm mt-1">
                    O espera a que un usuario inicie una
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header del chat */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center overflow-hidden">
                    {conversacion.usuario?.foto ? (
                      <img
                        src={conversacion.usuario.foto}
                        alt={conversacion.usuario.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icons.User className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {conversacion.usuario?.nombre}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {conversacion.usuario?.email}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${getTipoUsuarioColor(
                      conversacion.usuario?.tipoUsuario,
                    )}`}
                  >
                    {conversacion.usuario?.tipoUsuario}
                  </span>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900">
                  {mensajes.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.remitenteId === usuario.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          msg.remitenteId === usuario.id
                            ? "bg-primary-600 text-white"
                            : "bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow"
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
                            <span>{msg.leido ? "✓✓" : "✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Indicador de escribiendo */}
                  {escribiendo && escribiendo.usuarioId !== usuario.id && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-neutral-700 rounded-lg px-3 py-2 shadow">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={mensajesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleEnviar}
                  className="p-3 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={mensaje}
                      onChange={handleInputChange}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-full bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={!conectado || enviando}
                    />
                    <button
                      type="submit"
                      disabled={!mensaje.trim() || !conectado || enviando}
                      className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      {enviando ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Icons.Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
