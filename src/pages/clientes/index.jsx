import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import Link from "next/link";

export default function ClienteDashboard() {
  const { getEstadisticas, pedidos } = useCliente();
  const stats = getEstadisticas();

  const ultimosPedidos = pedidos.slice(0, 5);

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Bienvenido a tu panel de control</p>
          </div>
          <Link
            href="/clientes/pedidos/nuevo"
            className="mt-4 md:mt-0 btn-primary inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Nuevo Pedido</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Pedidos Pendientes</p>
                <p className="text-3xl font-bold">{stats.pedidosPendientes}</p>
              </div>
              <span className="text-4xl opacity-80">📦</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">En Camino</p>
                <p className="text-3xl font-bold">{stats.pedidosEnCamino}</p>
              </div>
              <span className="text-4xl opacity-80">🚚</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Entregados</p>
                <p className="text-3xl font-bold">{stats.pedidosEntregados}</p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Balance</p>
                <p className="text-3xl font-bold">
                  ${stats.balance.toLocaleString()}
                </p>
              </div>
              <span className="text-4xl opacity-80">💰</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">
              Ingresos del Mes
            </h3>
            <p className="text-2xl font-bold text-green-600">
              ${stats.ingresos.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">+12% vs mes anterior</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">
              Egresos del Mes
            </h3>
            <p className="text-2xl font-bold text-red-600">
              ${stats.egresos.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">-5% vs mes anterior</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">Total Pedidos</h3>
            <p className="text-2xl font-bold text-primary">
              {stats.totalPedidos}
            </p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </div>
        </div>

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Últimos Pedidos</h3>
              <Link
                href="/clientes/pedidos"
                className="text-primary hover:underline text-sm"
              >
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Depósito</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">#{pedido.id}</td>
                      <td className="py-3 text-gray-600">{pedido.fecha}</td>
                      <td className="py-3 text-gray-600">{pedido.deposito}</td>
                      <td className="py-3 font-medium">
                        ${pedido.total.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <EstadoBadge estado={pedido.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📦</span>
                <span className="font-medium">Crear Pedido</span>
              </Link>
              <Link
                href="/clientes/depositos"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🏭</span>
                <span className="font-medium">Ver Depósitos</span>
              </Link>
              <Link
                href="/clientes/pedidos"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📋</span>
                <span className="font-medium">Mis Pedidos</span>
              </Link>
              <Link
                href="/clientes/contabilidad"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">💰</span>
                <span className="font-medium">Mi Contabilidad</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Mis Calificaciones */}
        <MisCalificaciones colorPrimary="blue" />
      </div>
    </ClienteLayout>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: "bg-yellow-100 text-yellow-800",
    en_camino: "bg-blue-100 text-blue-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };

  const textos = {
    pendiente: "Pendiente",
    en_camino: "En Camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}
