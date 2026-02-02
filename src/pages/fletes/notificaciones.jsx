import { useState } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import { formatDate } from "@/utils/formatters";

export default function FleteNotificaciones() {
  const {
    notificaciones,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    getNotificacionesNoLeidas,
  } = useFlete();
  const [filtro, setFiltro] = useState("todas");

  const noLeidas = getNotificacionesNoLeidas();

  let notificacionesFiltradas = notificaciones;
  if (filtro === "no-leidas") {
    notificacionesFiltradas = notificaciones.filter((n) => !n.leida);
  } else if (filtro === "leidas") {
    notificacionesFiltradas = notificaciones.filter((n) => n.leida);
  }

  // Ordenar por fecha más reciente
  notificacionesFiltradas = [...notificacionesFiltradas].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  );

  const getTipoIcon = (tipo) => {
    const icons = {
      nuevo_envio: "📦",
      envio_urgente: "🚨",
      mensaje: "💬",
      sistema: "⚙️",
      pago: "💰",
      alerta: "⚠️",
    };
    return icons[tipo] || "📬";
  };

  const getTipoColor = (tipo) => {
    const colors = {
      nuevo_envio: "bg-blue-100 text-blue-700",
      envio_urgente: "bg-red-100 text-red-700",
      mensaje: "bg-green-100 text-green-700",
      sistema: "bg-gray-100 text-gray-700",
      pago: "bg-yellow-100 text-yellow-700",
      alerta: "bg-orange-100 text-orange-700",
    };
    return colors[tipo] || "bg-gray-100 text-gray-700";
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
            <p className="text-gray-600">
              Tienes {noLeidas.length} notificaciones sin leer
            </p>
          </div>
          {noLeidas.length > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="mt-4 md:mt-0 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              ✓ Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-gray-800">
              {notificaciones.length}
            </p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-600">
              {noLeidas.length}
            </p>
            <p className="text-sm text-gray-500">Sin leer</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">
              {notificaciones.length - noLeidas.length}
            </p>
            <p className="text-sm text-gray-500">Leídas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "todas", label: "Todas", icon: "📬" },
              { value: "no-leidas", label: "Sin leer", icon: "🔔" },
              { value: "leidas", label: "Leídas", icon: "✓" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  filtro === f.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
                {f.value === "no-leidas" && noLeidas.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {noLeidas.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        {notificacionesFiltradas.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Sin notificaciones
            </h3>
            <p className="text-gray-500">
              {filtro === "no-leidas"
                ? "¡Genial! No tienes notificaciones pendientes"
                : "No hay notificaciones para mostrar"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacionesFiltradas.map((notif) => (
              <div
                key={notif.id}
                className={`card transition-all ${
                  !notif.leida
                    ? "border-l-4 border-orange-500 bg-orange-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getTipoColor(notif.tipo)}`}
                  >
                    <span className="text-2xl">{getTipoIcon(notif.tipo)}</span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold ${
                          !notif.leida ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {notif.titulo}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(notif.fecha)}
                      </span>
                    </div>
                    <p
                      className={`mt-1 ${
                        !notif.leida ? "text-gray-700" : "text-gray-500"
                      }`}
                    >
                      {notif.mensaje}
                    </p>

                    {/* Acciones */}
                    <div className="flex items-center gap-3 mt-3">
                      {!notif.leida && (
                        <button
                          onClick={() => marcarNotificacionLeida(notif.id)}
                          className="text-sm text-orange-600 hover:underline"
                        >
                          Marcar como leída
                        </button>
                      )}
                      <button
                        onClick={() => eliminarNotificacion(notif.id)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Indicador de no leída */}
                  {!notif.leida && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preferencias de Notificaciones */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            ⚙️ Preferencias de Notificaciones
          </h3>
          <div className="space-y-4">
            {[
              { label: "Nuevos envíos asignados", enabled: true },
              { label: "Envíos urgentes", enabled: true },
              { label: "Mensajes de depósitos", enabled: true },
              { label: "Recordatorios de mantenimiento", enabled: true },
              { label: "Pagos recibidos", enabled: false },
              { label: "Actualizaciones del sistema", enabled: false },
            ].map((pref, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-700">{pref.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={pref.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
