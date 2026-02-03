import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import Icons from "@/components/Icons";
import { formatNumber } from "@/utils/formatters";
import Link from "next/link";

export default function DepositoDashboard() {
  const {
    getEstadisticas,
    pedidos,
    getProductosStockBajo,
    envios,
    cargandoPedidos,
    cargandoInventario,
  } = useDeposito();

  // Mostrar loading mientras se cargan los datos
  if (cargandoPedidos || cargandoInventario) {
    return (
      <DepositoLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      </DepositoLayout>
    );
  }

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Resumen de operaciones del depósito
            </p>
          </div>
          <Link
            href="/depositos/pedidos"
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Icons.Package className="w-5 h-5" />
            <span>Ver Pedidos</span>
          </Link>
        </div>

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs sm:text-sm">Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosPendientes}
                </p>
              </div>
              <Icons.Clock className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Preparando</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosPreparando}
                </p>
              </div>
              <Icons.ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">Listos</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosListos}
                </p>
              </div>
              <Icons.CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm">En Camino</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosEnviados}
                </p>
              </div>
              <Icons.Truck className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                  Total Productos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                  {stats.totalProductos}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icons.Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                  Stock Bajo
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.productosStockBajo}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Icons.Alert className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="card !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                  Vehículos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                  {stats.vehiculosDisponibles}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Icons.Truck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                  Conductores
                </p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                  {stats.conductoresDisponibles}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Icons.User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pending Orders */}
          <div className="lg:col-span-2 card !p-4 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                Pedidos por Procesar
              </h3>
              <Link
                href="/depositos/pedidos"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>

            {pedidosPendientes.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-neutral-500 dark:text-neutral-400">
                <Icons.CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                No hay pedidos pendientes
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {pedidosPendientes.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
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
                        <p className="font-medium text-neutral-800 dark:text-neutral-100">
                          #{pedido.id} - {pedido.cliente}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
                        className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
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
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <Link
                  href="/depositos/pedidos"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-xl">📦</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Procesar Pedidos
                  </span>
                </Link>
                <Link
                  href="/depositos/inventario"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-xl">📋</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Ver Inventario
                  </span>
                </Link>
                <Link
                  href="/depositos/envios"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-xl">🚚</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Gestionar Envíos
                  </span>
                </Link>
                <Link
                  href="/depositos/contabilidad"
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="text-xl">💰</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    Contabilidad
                  </span>
                </Link>
              </div>
            </div>

            {/* Stock Alerts */}
            {productosStockBajo.length > 0 && (
              <div className="card border-l-4 border-red-500 dark:border-red-400">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="font-semibold text-red-800 dark:text-red-400">
                    Alertas de Stock
                  </h3>
                </div>
                <div className="space-y-2">
                  {productosStockBajo.slice(0, 3).map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {producto.nombre}
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {producto.stock} / {producto.stockMinimo}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/depositos/inventario"
                  className="block mt-3 text-center text-red-600 dark:text-red-400 hover:underline text-sm"
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
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                Envíos Activos
              </h3>
              <Link
                href="/depositos/envios"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enviosActivos.map((envio) => (
                <div
                  key={envio.id}
                  className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">
                      {envio.cliente}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        envio.estado === "en_transito"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {envio.estado === "en_transito"
                        ? "🚚 En Tránsito"
                        : "🏭 Esperando Retiro"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    📍 {envio.direccion}
                  </p>
                  {envio.conductor && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      👤 {envio.conductor} • {envio.vehiculo}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    ⏰ Estimado: {envio.fechaEstimada}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  Ingresos
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${formatNumber(stats.ingresos)}
                </p>
              </div>
              <span className="text-3xl">📈</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  Egresos
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  ${formatNumber(stats.egresos)}
                </p>
              </div>
              <span className="text-3xl">📉</span>
            </div>
          </div>

          <div
            className={`card border ${stats.balance >= 0 ? "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800" : "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${stats.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}
                >
                  Balance
                </p>
                <p
                  className={`text-2xl font-bold ${stats.balance >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}
                >
                  {stats.balance >= 0 ? "+" : ""}${formatNumber(stats.balance)}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="primary" />
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
