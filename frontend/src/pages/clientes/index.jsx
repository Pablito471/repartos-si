import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import Icons from "@/components/Icons";
import Link from "next/link";

export default function ClienteDashboard() {
  const { getEstadisticas, pedidos, cargandoPedidos, cargandoDepositos } =
    useCliente();

  // Mostrar loading mientras se cargan los datos
  if (cargandoPedidos || cargandoDepositos) {
    return (
      <ClienteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">
            Cargando datos...
          </span>
        </div>
      </ClienteLayout>
    );
  }

  const stats = getEstadisticas();
  const ultimosPedidos = pedidos.slice(0, 5);

  return (
    <ClienteLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              Bienvenido a tu panel de control
            </p>
          </div>
          <Link
            href="/clientes/pedidos/nuevo"
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Icons.Plus className="w-5 h-5" />
            <span>Nuevo Pedido</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm">Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosPendientes}
                </p>
              </div>
              <Icons.Package className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs sm:text-sm">En Camino</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stats.pedidosEnCamino}
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
                  {stats.pedidosEntregados}
                </p>
              </div>
              <Icons.CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white !p-3 sm:!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">Balance</p>
                <p className="text-xl sm:text-3xl font-bold">
                  ${stats.balance.toLocaleString()}
                </p>
              </div>
              <Icons.Wallet className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Ingresos del Mes
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.ingresos.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              +12% vs mes anterior
            </p>
          </div>

          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Egresos del Mes
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              ${stats.egresos.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              -5% vs mes anterior
            </p>
          </div>

          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
              Total Pedidos
            </h3>
            <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats.totalPedidos}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Este mes
            </p>
          </div>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 card !p-4 sm:!p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                Últimos Pedidos
              </h3>
              <Link
                href="/clientes/pedidos"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="text-left text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-3 px-4 sm:px-0">ID</th>
                    <th className="pb-3 hidden sm:table-cell">Fecha</th>
                    <th className="pb-3">Depósito</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3 pr-4 sm:pr-0">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="border-b border-neutral-200 dark:border-neutral-700 last:border-0 text-sm"
                    >
                      <td className="py-3 px-4 sm:px-0 font-medium text-neutral-800 dark:text-neutral-100">
                        #{pedido.id}
                      </td>
                      <td className="py-3 text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">
                        {pedido.fecha}
                      </td>
                      <td className="py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[100px]">
                        {pedido.deposito}
                      </td>
                      <td className="py-3 font-medium text-neutral-800 dark:text-neutral-100">
                        ${pedido.total.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 sm:pr-0">
                        <EstadoBadge estado={pedido.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card !p-4 sm:!p-6">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-2 sm:space-y-3">
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Icons.Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-medium text-sm text-neutral-800 dark:text-neutral-100">
                  Crear Pedido
                </span>
              </Link>
              <Link
                href="/clientes/depositos"
                className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                  <Icons.Building className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <span className="font-medium text-sm text-neutral-800 dark:text-neutral-100">
                  Ver Depósitos
                </span>
              </Link>
              <Link
                href="/clientes/pedidos"
                className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center">
                  <Icons.ClipboardList className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <span className="font-medium text-sm text-neutral-800 dark:text-neutral-100">
                  Mis Pedidos
                </span>
              </Link>
              <Link
                href="/clientes/contabilidad"
                className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Icons.Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-sm text-neutral-800 dark:text-neutral-100">
                  Mi Contabilidad
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="primary" />
      </div>
    </ClienteLayout>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    en_camino:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    entregado:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const textos = {
    pendiente: "Pendiente",
    en_camino: "En Camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}
