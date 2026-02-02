import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import { formatNumber } from "@/utils/formatters";
import Link from "next/link";

export default function FleteDashboard() {
  const { getEstadisticas, getEnviosDelDia, vehiculo } = useFlete();
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">
              Bienvenido, tienes {stats.enviosPendientesHoy} envíos pendientes
              hoy
            </p>
          </div>
          <Link
            href="/fletes/ruta"
            className="mt-4 md:mt-0 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center space-x-2"
          >
            <span>🗺️</span>
            <span>Ver Ruta del Día</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pendientes</p>
                <p className="text-3xl font-bold">{stats.enviosPendientes}</p>
              </div>
              <span className="text-4xl opacity-80">⏳</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">En Camino</p>
                <p className="text-3xl font-bold">{stats.enviosEnCamino}</p>
              </div>
              <span className="text-4xl opacity-80">🚚</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Entregados</p>
                <p className="text-3xl font-bold">{stats.enviosEntregados}</p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Tasa de Éxito</p>
                <p className="text-3xl font-bold">{stats.tasaExito}%</p>
              </div>
              <span className="text-4xl opacity-80">📈</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">Ingresos</h3>
            <p className="text-2xl font-bold text-green-600">
              ${formatNumber(stats.ingresos)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">Gastos</h3>
            <p className="text-2xl font-bold text-red-600">
              ${formatNumber(stats.egresos)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">Balance</h3>
            <p
              className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ${formatNumber(stats.balance)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>
        </div>

        {/* Today's Deliveries & Vehicle Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Deliveries */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Envíos de Hoy</h3>
              <Link
                href="/fletes/envios"
                className="text-orange-600 hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>

            {enviosHoy.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="text-gray-500">No tienes envíos para hoy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enviosHoy.map((envio) => (
                  <div
                    key={envio.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                        <p className="font-medium text-gray-800">
                          {envio.cliente}
                        </p>
                        <p className="text-sm text-gray-500">
                          {envio.direccion}
                        </p>
                        <p className="text-xs text-gray-400">
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
                      <p className="text-sm font-medium text-gray-700 mt-1">
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
            {/* Vehicle Status */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Mi Vehículo</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">🚚</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {vehiculo.marca} {vehiculo.modelo}
                  </p>
                  <p className="text-sm text-gray-500">{vehiculo.patente}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      vehiculo.estado === "operativo"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
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
                  <span className="text-gray-500">Kilometraje:</span>
                  <span className="font-medium">
                    {formatNumber(vehiculo.kmActual)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Próximo service:</span>
                  <span className="font-medium">
                    {formatNumber(vehiculo.proximoService)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacidad:</span>
                  <span className="font-medium">{vehiculo.capacidad}</span>
                </div>
              </div>
              <Link
                href="/fletes/vehiculo"
                className="mt-4 block text-center text-orange-600 hover:underline text-sm"
              >
                Ver detalles →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                <Link
                  href="/fletes/envios"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <span className="font-medium">Ver Envíos</span>
                </Link>
                <Link
                  href="/fletes/ruta"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">🗺️</span>
                  <span className="font-medium">Mi Ruta</span>
                </Link>
                <Link
                  href="/fletes/contabilidad"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">💰</span>
                  <span className="font-medium">Mis Ganancias</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="orange" />
      </div>
    </FleteLayout>
  );
}
