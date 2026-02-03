import { useState, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import Icons from "./Icons";

export default function ChatWidget() {
  const { usuario } = useAuth();
  const {
    conectado,
    conversacion,
    mensajes,
    noLeidos,
    cargando,
    escribiendo,
    iniciarConversacion,
    cargarMensajes,
    enviarMensaje,
    indicarEscribiendo,
    marcarComoLeidos,
  } = useChat();

  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const mensajesEndRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Iniciar conversación al abrir
  useEffect(() => {
    if (
      abierto &&
      !conversacion &&
      usuario &&
      usuario.tipoUsuario !== "admin"
    ) {
      iniciarConversacion();
    }
  }, [abierto, conversacion, iniciarConversacion, usuario]);

  // Cargar mensajes cuando hay conversación
  useEffect(() => {
    if (abierto && conversacion) {
      cargarMensajes();
    }
  }, [abierto, conversacion, cargarMensajes]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes]);

  // Focus en input al abrir
  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [abierto]);

  // Marcar como leídos al abrir
  useEffect(() => {
    if (abierto && conversacion) {
      marcarComoLeidos();
    }
  }, [abierto, conversacion, marcarComoLeidos]);

  // No mostrar para admin (tienen su propia página de chat)
  if (!usuario || usuario.tipoUsuario === "admin") {
    return null;
  }

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

    // Indicar que está escribiendo
    indicarEscribiendo(true);

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Dejar de escribir después de 2 segundos sin actividad
    timeoutRef.current = setTimeout(() => {
      indicarEscribiendo(false);
    }, 2000);
  };

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
      >
        {abierto ? (
          <Icons.X className="w-6 h-6" />
        ) : (
          <>
            <Icons.Chat className="w-6 h-6" />
            {noLeidos > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {noLeidos > 9 ? "9+" : noLeidos}
              </span>
            )}
          </>
        )}
      </button>

      {/* Ventana de chat */}
      {abierto && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-neutral-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Icons.Support className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Soporte</h3>
              <p className="text-xs text-primary-100">
                {conectado ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    En línea
                  </span>
                ) : (
                  "Conectando..."
                )}
              </p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-900">
            {cargando ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : mensajes.length === 0 ? (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                <Icons.Chat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>¡Hola! ¿En qué podemos ayudarte?</p>
                <p className="text-sm mt-1">Escribe tu mensaje abajo</p>
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
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
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
              ))
            )}

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
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-full bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        </div>
      )}
    </>
  );
}
