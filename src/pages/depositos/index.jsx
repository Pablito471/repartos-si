import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import { formatNumber } from "@/utils/formatters";
import Link from "next/link";

export default function DepositoDashboard() {
  const { getEstadisticas, pedidos, getProductosStockBajo, envios } =
    useDeposito();
  const stats = getEstadisticas();
  const productosStockBajo = getProductosStockBajo();
  const pedidosPendientes = pedidos
    .filter((p) => p.estado === "pendiente" || p.estado === "preparando")
    .slice(0, 5);
  const enviosActivos = envios.filter(
    (e) => e.estado === "en_transito" || e.estado === "esperando_retiro",
  );

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Resumen de operaciones del depósito</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/depositos/pedidos"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>📦</span>
              <span>Ver Pedidos</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pendientes</p>
                <p className="text-3xl font-bold">{stats.pedidosPendientes}</p>
              </div>
              <span className="text-4xl opacity-80">⏳</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Preparando</p>
                <p className="text-3xl font-bold">{stats.pedidosPreparando}</p>
              </div>
              <span className="text-4xl opacity-80">📋</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Listos</p>
                <p className="text-3xl font-bold">{stats.pedidosListos}</p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">En Camino</p>
                <p className="text-3xl font-bold">{stats.pedidosEnviados}</p>
              </div>
              <span className="text-4xl opacity-80">🚚</span>
            </div>
          </div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Productos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalProductos}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.productosStockBajo}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Vehículos Disp.</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.vehiculosDisponibles}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚛</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Conductores Disp.</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.conductoresDisponibles}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Pedidos por Procesar
              </h3>
              <Link
                href="/depositos/pedidos"
                className="text-primary hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>

            {pedidosPendientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">✅</span>
                No hay pedidos pendientes
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosPendientes.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          pedido.prioridad === "alta"
                            ? "bg-red-500"
                            : pedido.prioridad === "media"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          #{pedido.id} - {pedido.cliente}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pedido.productos.length} productos •{" "}
                          {pedido.tipoEnvio === "envio"
                            ? "🚚 Envío"
                            : pedido.tipoEnvio === "flete"
                              ? "🚛 Flete"
                              : "🏭 Retiro"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EstadoBadge estado={pedido.estado} />
                      <Link
                        href={`/depositos/pedidos/${pedido.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <Link
                  href="/depositos/pedidos"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">📦</span>
                  <span className="font-medium">Procesar Pedidos</span>
                </Link>
                <Link
                  href="/depositos/inventario"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">📋</span>
                  <span className="font-medium">Ver Inventario</span>
                </Link>
                <Link
                  href="/depositos/envios"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">🚚</span>
                  <span className="font-medium">Gestionar Envíos</span>
                </Link>
                <Link
                  href="/depositos/contabilidad"
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">💰</span>
                  <span className="font-medium">Contabilidad</span>
                </Link>
              </div>
            </div>

            {/* Stock Alerts */}
            {productosStockBajo.length > 0 && (
              <div className="card border-l-4 border-red-500">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="font-semibold text-red-800">
                    Alertas de Stock
                  </h3>
                </div>
                <div className="space-y-2">
                  {productosStockBajo.slice(0, 3).map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{producto.nombre}</span>
                      <span className="text-red-600 font-medium">
                        {producto.stock} / {producto.stockMinimo}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/depositos/inventario"
                  className="block mt-3 text-center text-red-600 hover:underline text-sm"
                >
                  Ver todos
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Active Shipments */}
        {enviosActivos.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Envíos Activos</h3>
              <Link
                href="/depositos/envios"
                className="text-primary hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enviosActivos.map((envio) => (
                <div key={envio.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {envio.cliente}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        envio.estado === "en_transito"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {envio.estado === "en_transito"
                        ? "🚚 En Tránsito"
                        : "🏭 Esperando Retiro"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">📍 {envio.direccion}</p>
                  {envio.conductor && (
                    <p className="text-sm text-gray-500">
                      👤 {envio.conductor} • {envio.vehiculo}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    ⏰ Estimado: {envio.fechaEstimada}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Ingresos</p>
                <p className="text-2xl font-bold text-green-700">
                  ${formatNumber(stats.ingresos)}
                </p>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Egresos</p>
                <p className="text-2xl font-bold text-red-700">
                  ${formatNumber(stats.egresos)}
                </p>
              </div>
              <span className="text-3xl">📉</span>
            </div>
          </div>

          <div
            className={`card border ${stats.balance >= 0 ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200" : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${stats.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                >
                  Balance
                </p>
                <p
                  className={`text-2xl font-bold ${stats.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}
                >
                  {stats.balance >= 0 ? "+" : ""}${formatNumber(stats.balance)}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="green" />
      </div>
    </DepositoLayout>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: "bg-yellow-100 text-yellow-800",
    preparando: "bg-blue-100 text-blue-800",
    listo: "bg-purple-100 text-purple-800",
    enviado: "bg-green-100 text-green-800",
    entregado: "bg-gray-100 text-gray-800",
  };

  const textos = {
    pendiente: "Pendiente",
    preparando: "Preparando",
    listo: "Listo",
    enviado: "Enviado",
    entregado: "Entregado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}
