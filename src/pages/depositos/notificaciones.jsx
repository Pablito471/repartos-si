import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { formatNumber } from "@/utils/formatters";
import { useState } from "react";
import Link from "next/link";

export default function Notificaciones() {
  const {
    notificaciones,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    getNotificacionesNoLeidas,
  } = useDeposito();

  const [filtro, setFiltro] = useState("todas");

  const notificacionesFiltradas =
    filtro === "todas"
      ? notificaciones
      : filtro === "no_leidas"
        ? notificaciones.filter((n) => !n.leida)
        : notificaciones.filter((n) => n.tipo === filtro);

  const notificacionesNoLeidas = getNotificacionesNoLeidas();

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHoras < 24) return `Hace ${diffHoras} horas`;
    if (diffDias < 7) return `Hace ${diffDias} días`;

    return fecha.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case "pedido":
        return "📦";
      case "stock":
        return "📋";
      case "envio":
        return "🚚";
      case "alerta":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getColorTipo = (tipo) => {
    switch (tipo) {
      case "pedido":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "stock":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "envio":
        return "bg-green-100 text-green-800 border-green-200";
      case "alerta":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
            <p className="text-gray-600">
              {notificacionesNoLeidas.length > 0
                ? `Tienes ${notificacionesNoLeidas.length} notificaciones sin leer`
                : "No tienes notificaciones pendientes"}
            </p>
          </div>

          {notificacionesNoLeidas.length > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="btn-secondary whitespace-nowrap"
            >
              ✓ Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "todas", label: "Todas", count: notificaciones.length },
              {
                id: "no_leidas",
                label: "No leídas",
                count: notificacionesNoLeidas.length,
              },
              {
                id: "pedido",
                label: "📦 Pedidos",
                count: notificaciones.filter((n) => n.tipo === "pedido").length,
              },
              {
                id: "stock",
                label: "📋 Stock",
                count: notificaciones.filter((n) => n.tipo === "stock").length,
              },
              {
                id: "envio",
                label: "🚚 Envíos",
                count: notificaciones.filter((n) => n.tipo === "envio").length,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtro === f.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filtro === f.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de notificaciones */}
        {notificacionesFiltradas.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">🔔</span>
            <h3 className="text-xl font-semibold text-gray-700">
              No hay notificaciones
            </h3>
            <p className="text-gray-500 mt-2">
              {filtro === "todas"
                ? "No tienes notificaciones aún"
                : "No hay notificaciones con este filtro"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacionesFiltradas.map((notificacion) => (
              <div
                key={notificacion.id}
                className={`card transition-all ${
                  !notificacion.leida
                    ? "ring-2 ring-green-500/50 bg-green-50/30"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getColorTipo(notificacion.tipo)}`}
                  >
                    <span className="text-xl">
                      {getIconoTipo(notificacion.tipo)}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {notificacion.titulo}
                          {!notificacion.leida && (
                            <span className="ml-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {notificacion.mensaje}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {formatearFecha(notificacion.fecha)}
                      </span>
                    </div>

                    {/* Detalles del pedido si existe */}
                    {notificacion.datos?.productos && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Productos del pedido:
                        </p>
                        <div className="space-y-1">
                          {notificacion.datos.productos.map((prod, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {prod.nombre} x{prod.cantidad}
                              </span>
                              <span className="font-medium">
                                ${formatNumber(prod.precio * prod.cantidad)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {notificacion.datos.tipoEnvio && (
                          <p className="text-sm text-gray-500 mt-2 pt-2 border-t">
                            <strong>Envío:</strong>{" "}
                            {notificacion.datos.tipoEnvio === "envio"
                              ? "Domicilio"
                              : notificacion.datos.tipoEnvio === "flete"
                                ? "Flete"
                                : "Retiro"}{" "}
                            - {notificacion.datos.direccion}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center gap-3 mt-3">
                      {notificacion.datos?.pedidoId && (
                        <Link
                          href="/depositos/pedidos"
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Ver pedido →
                        </Link>
                      )}
                      {!notificacion.leida && (
                        <button
                          onClick={() =>
                            marcarNotificacionLeida(notificacion.id)
                          }
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Marcar como leída
                        </button>
                      )}
                      <button
                        onClick={() => eliminarNotificacion(notificacion.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DepositoLayout>
  );
}
