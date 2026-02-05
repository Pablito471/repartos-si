import { useState, useRef, useEffect } from "react";
import {
  useNotificaciones,
  CATEGORIAS,
  PRIORIDADES,
} from "@/context/NotificacionContext";
import Icons from "./Icons";

export default function NotificacionesPanel({ className = "" }) {
  const {
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarNotificaciones,
    solicitarPermisoNotificaciones,
    filtroCategoria,
    setFiltroCategoria,
    getNotificacionesFiltradas,
    getConteoPorCategoria,
    sonidoHabilitado,
    vibracionHabilitada,
    toggleSonido,
    toggleVibracion,
    playNotificationSound,
    PRIORIDADES,
  } = useNotificaciones();

  const [abierto, setAbierto] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const panelRef = useRef(null);

  const notificacionesFiltradas = getNotificacionesFiltradas();
  const conteo = getConteoPorCategoria();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setAbierto(false);
        setMostrarConfig(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (diffMins < 60) return "Hace " + diffMins + " min";
    if (diffHoras < 24) return "Hace " + diffHoras + "h";
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return "Hace " + diffDias + " dias";
    return notifFecha.toLocaleDateString("es-AR");
  };

  const getIconoClase = (tipo, icono) => {
    // Retorna un componente de icono basado en el tipo
    const iconoMap = {
      mensaje: "Chat",
      pedido: "ShoppingCart",
      envio: "Truck",
      stock: "Alert",
      cuenta: "User",
      sistema: "Cog",
      check: "CheckCircle",
      warning: "Alert",
      video: "Video",
      chat: "Chat",
      truck: "Truck",
    };
    return iconoMap[icono] || iconoMap[tipo] || "Bell";
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      [PRIORIDADES.URGENTE]:
        "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20",
      [PRIORIDADES.ALTA]:
        "border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20",
      [PRIORIDADES.NORMAL]: "",
      [PRIORIDADES.BAJA]: "opacity-75",
    };
    return colores[prioridad] || "";
  };

  const categoriasFiltro = [
    { key: CATEGORIAS.TODAS, label: "Todas", Icon: Icons.Bell },
    { key: CATEGORIAS.PEDIDOS, label: "Pedidos", Icon: Icons.ShoppingCart },
    { key: CATEGORIAS.ENVIOS, label: "Envios", Icon: Icons.Truck },
    { key: CATEGORIAS.MENSAJES, label: "Mensajes", Icon: Icons.Chat },
    { key: CATEGORIAS.STOCK, label: "Stock", Icon: Icons.Package },
  ];

  const handleNotificacionClick = (notif) => {
    if (!notif.leida) marcarComoLeida(notif.id);
  };

  const renderIcono = (tipo, icono) => {
    const iconName = getIconoClase(tipo, icono);
    const IconComponent = Icons[iconName];
    if (IconComponent) {
      return <IconComponent className="w-5 h-5" />;
    }
    return <Icons.Bell className="w-5 h-5" />;
  };

  return (
    <div className={"relative " + className} ref={panelRef}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Icons.Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-[420px] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-primary-500 to-primary-600">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Icons.Bell className="w-5 h-5" />
                Notificaciones
                {noLeidas > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {noLeidas} nuevas
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMostrarConfig(!mostrarConfig)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title="Configuracion"
                >
                  <Icons.Cog className="w-4 h-4" />
                </button>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white text-xs font-bold"
                    title="Marcar todas como leidas"
                  >
                    <Icons.CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {notificacionesFiltradas.length > 0 && (
                  <button
                    onClick={limpiarNotificaciones}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                    title="Limpiar todas"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Configuracion */}
          {mostrarConfig && (
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Configuracion
              </p>
              <div className="flex gap-4">
                <button
                  onClick={toggleSonido}
                  className={
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors " +
                    (sonidoHabilitado
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500")
                  }
                >
                  {sonidoHabilitado ? (
                    <Icons.Speaker className="w-4 h-4" />
                  ) : (
                    <Icons.SpeakerOff className="w-4 h-4" />
                  )}
                  Sonido
                </button>
                <button
                  onClick={toggleVibracion}
                  className={
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors " +
                    (vibracionHabilitada
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500")
                  }
                >
                  <Icons.Phone className="w-4 h-4" />
                  Vibración
                </button>
                {sonidoHabilitado && (
                  <button
                    onClick={() =>
                      playNotificationSound(PRIORIDADES.NORMAL, "default")
                    }
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                    title="Probar sonido"
                  >
                    <Icons.Play className="w-4 h-4" />
                    Probar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {categoriasFiltro.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFiltroCategoria(cat.key)}
                  className={
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all " +
                    (filtroCategoria === cat.key
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700")
                  }
                >
                  <cat.Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  {conteo[cat.key] > 0 && (
                    <span
                      className={
                        "ml-1 px-1.5 py-0.5 rounded-full text-[10px] " +
                        (filtroCategoria === cat.key
                          ? "bg-white/20"
                          : "bg-red-500 text-white")
                      }
                    >
                      {conteo[cat.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {notificacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <Icons.Inbox className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  No tienes notificaciones
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                  Te avisaremos cuando haya novedades
                </p>
              </div>
            ) : (
              <div>
                {notificacionesFiltradas.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificacionClick(notif)}
                    className={
                      "p-4 cursor-pointer transition-all duration-300 border-b border-neutral-100 dark:border-neutral-700 last:border-0 " +
                      (notif.leida
                        ? "bg-white dark:bg-neutral-800"
                        : "bg-primary-50 dark:bg-primary-900/20") +
                      " " +
                      getPrioridadColor(notif.prioridad) +
                      " " +
                      (notif.animacion ? "animate-slide-in" : "") +
                      " hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    }
                  >
                    <div className="flex gap-3">
                      <div
                        className={
                          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center " +
                          (notif.prioridad === PRIORIDADES.URGENTE
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse"
                            : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300")
                        }
                      >
                        {renderIcono(notif.tipo, notif.icono)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={
                                "text-sm font-medium " +
                                (notif.leida
                                  ? "text-neutral-700 dark:text-neutral-300"
                                  : "text-neutral-900 dark:text-white")
                              }
                            >
                              {notif.titulo}
                            </p>
                            {notif.prioridad === PRIORIDADES.URGENTE && (
                              <span className="inline-block px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded mt-0.5">
                                URGENTE
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarNotificacion(notif.id);
                            }}
                            className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {notif.mensaje}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-xs text-neutral-400 dark:text-neutral-500">
                            {formatTiempo(notif.fecha)}
                          </p>
                          {!notif.leida && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
