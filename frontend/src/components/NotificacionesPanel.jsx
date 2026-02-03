import { useState, useRef, useEffect } from "react";
import { useNotificaciones } from "@/context/NotificacionContext";
import Icons from "./Icons";

export default function NotificacionesPanel({ className = "" }) {
  const {
    notificaciones,
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificaciones,
    solicitarPermisoNotificaciones,
  } = useNotificaciones();

  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Solicitar permiso de notificaciones al abrir por primera vez
  useEffect(() => {
    if (abierto && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        solicitarPermisoNotificaciones();
      }
    }
  }, [abierto, solicitarPermisoNotificaciones]);

  const formatTiempo = (fecha) => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diffMs = ahora - notifFecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return notifFecha.toLocaleDateString("es-AR");
  };

  const getIcono = (tipo, icono) => {
    if (icono) return icono;
    switch (tipo) {
      case "mensaje":
        return "💬";
      case "pedido":
        return "📦";
      case "envio":
        return "🚚";
      case "stock":
        return "⚠️";
      case "cuenta":
        return "👤";
      default:
        return "🔔";
    }
  };

  const handleNotificacionClick = (notif) => {
    if (!notif.leida) {
      marcarComoLeida(notif.id);
    }
    // Aquí se podría navegar a la página relevante según el tipo
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Icons.Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              Notificaciones
            </h3>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Marcar todas leídas
                </button>
              )}
              {notificaciones.length > 0 && (
                <button
                  onClick={limpiarNotificaciones}
                  className="text-xs text-neutral-500 hover:text-red-500"
                  title="Limpiar todas"
                >
                  <Icons.Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-neutral-500 dark:text-neutral-400">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {notificaciones.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificacionClick(notif)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notif.leida
                        ? "bg-white dark:bg-neutral-800"
                        : "bg-primary-50 dark:bg-primary-900/20"
                    } hover:bg-neutral-50 dark:hover:bg-neutral-700`}
                  >
                    <div className="flex gap-3">
                      {/* Icono */}
                      <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center text-lg">
                        {getIcono(notif.tipo, notif.icono)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notif.leida
                                ? "text-neutral-700 dark:text-neutral-300"
                                : "text-neutral-900 dark:text-white"
                            }`}
                          >
                            {notif.titulo}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarNotificacion(notif.id);
                            }}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {notif.mensaje}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {formatTiempo(notif.fecha)}
                        </p>
                      </div>

                      {/* Indicador de no leída */}
                      {!notif.leida && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 5 && (
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
              <p className="text-xs text-center text-neutral-500">
                Mostrando {notificaciones.length} notificaciones
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
