import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import Icons from "@/components/Icons";
import { formatNumber } from "@/utils/formatters";
import Link from "next/link";

export default function FleteDashboard() {
  const { getEstadisticas, getEnviosDelDia, vehiculo, cargandoEnvios } =
    useFlete();

  // Mostrar loading mientras se cargan los datos
  if (cargandoEnvios) {
    return (
      <FleteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      </FleteLayout>
    );
  }

  const stats = getEstadisticas();
  const enviosHoy = getEnviosDelDia();

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: "bg-yellow-100 text-yellow-800",
      en_camino: "bg-blue-100 text-blue-800",
      entregado: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
      problema: "bg-orange-100 text-orange-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: "Pendiente",
      en_camino: "En Camino",
      entregado: "Entregado",
      cancelado: "Cancelado",
      problema: "Problema",
    };
    return textos[estado] || estado;
  };

  const getPrioridadColor = (prioridad) => {
    const colores = {
      alta: "text-red-600",
      media: "text-yellow-600",
      baja: "text-green-600",
    };
    return colores[prioridad] || "text-gray-600";
  };

  return (
    <FleteLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Tienes {stats.enviosPendientesHoy} envíos pendientes hoy
            </p>
          </div>
          <Link
            href="/fletes/ruta"
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Icons.Map className="w-5 h-5" />
            <span>Ver Ruta del Día</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs sm:text-sm">Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.enviosPendientes}
                </p>
              </div>
              <Icons.Clock className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">En Camino</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.enviosEnCamino}
                </p>
              </div>
              <Icons.Truck className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm">Entregados</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.enviosEntregados}
                </p>
              </div>
              <Icons.CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">Tasa Éxito</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.tasaExito}%
                </p>
              </div>
              <Icons.TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Ingresos
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              ${formatNumber(stats.ingresos)}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Este mes
            </p>
          </div>

          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Gastos
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              ${formatNumber(stats.egresos)}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Este mes
            </p>
          </div>

          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Balance
            </h3>
            <p
              className={`text-xl sm:text-2xl font-bold ${stats.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              ${formatNumber(stats.balance)}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Este mes
            </p>
          </div>
        </div>

        {/* Today's Deliveries & Vehicle Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Deliveries */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                Envíos de Hoy
              </h3>
              <Link
                href="/fletes/envios"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>

            {enviosHoy.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-neutral-500 dark:text-neutral-400">
                  No tienes envíos para hoy
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enviosHoy.map((envio) => (
                  <div
                    key={envio.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-10 rounded-full ${
                          envio.prioridad === "alta"
                            ? "bg-red-500"
                            : envio.prioridad === "media"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-100">
                          {envio.cliente}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {envio.direccion}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          {envio.horarioEntrega}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(envio.estado)}`}
                      >
                        {getEstadoTexto(envio.estado)}
                      </span>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mt-1">
                        ${formatNumber(envio.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Status & Quick Actions */}
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="card">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                Mi Vehículo
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">🚚</span>
                </div>
                <div>
                  <p className="font-medium text-neutral-800 dark:text-neutral-100">
                    {vehiculo.marca} {vehiculo.modelo}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {vehiculo.patente}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      vehiculo.estado === "operativo"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {vehiculo.estado === "operativo"
                      ? "Operativo"
                      : "En mantenimiento"}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Kilometraje:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {formatNumber(vehiculo.kmActual)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Capacidad:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {vehiculo.capacidad}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  href="/fletes/envios"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Mis Entregas
                  </span>
                </Link>
                <Link
                  href="/fletes/ruta"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-2xl">🗺️</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Mi Ruta
                  </span>
                </Link>
                <Link
                  href="/fletes/contabilidad"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-2xl">💰</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Mis Ganancias
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="primary" />
      </div>
    </FleteLayout>
  );
}
