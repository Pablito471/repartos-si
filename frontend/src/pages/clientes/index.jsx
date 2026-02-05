import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import MisCalificaciones from "@/components/MisCalificaciones";
import CalificarSection from "@/components/CalificarSection";
import Icons from "@/components/Icons";
import Link from "next/link";

export default function ClienteDashboard() {
  const { usuario } = useAuth();
  const {
    getEstadisticas,
    pedidos,
    cargandoPedidos,
    cargandoDepositos,
    getProductosStockBajo,
    cargandoStock,
  } = useCliente();

  // Obtener productos con stock bajo
  const productosStockBajo = getProductosStockBajo();

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

        {/* Perfil del Usuario */}
        <div className="card !p-3 sm:!p-4 lg:!p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <Icons.User className="w-4 h-4 sm:w-5 sm:h-5" />
              Mi Perfil
            </h3>
            <Link
              href="/clientes/perfil"
              className="text-primary-600 dark:text-primary-400 hover:underline text-xs sm:text-sm"
            >
              Editar
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {usuario?.foto ? (
                  <img
                    src={usuario.foto}
                    alt={usuario.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icons.User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  Nombre
                </p>
                <p className="font-medium text-sm sm:text-base text-neutral-800 dark:text-neutral-100 truncate">
                  {usuario?.nombre || "-"}
                </p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Email
              </p>
              <p className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                {usuario?.email || "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Teléfono
              </p>
              <p className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100">
                {usuario?.telefono || "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Dirección
              </p>
              <p className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                {usuario?.direccion || "-"}
              </p>
            </div>
          </div>
          {usuario?.datosFiscales && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Datos Fiscales
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                    CUIT/CUIL
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {usuario.datosFiscales.cuit || "-"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                    IVA
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {usuario.datosFiscales.condicionIva || "-"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                    Razón Social
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                    {usuario.datosFiscales.razonSocial || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="card !p-2.5 sm:!p-4 lg:!p-6">
            <h3 className="font-semibold text-[10px] sm:text-sm lg:text-base text-neutral-700 dark:text-neutral-300 mb-0.5 sm:mb-2 truncate">
              Ingresos
            </h3>
            <p className="text-sm sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.ingresos.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 hidden sm:block">
              Este mes
            </p>
          </div>

          <div className="card !p-2.5 sm:!p-4 lg:!p-6">
            <h3 className="font-semibold text-[10px] sm:text-sm lg:text-base text-neutral-700 dark:text-neutral-300 mb-0.5 sm:mb-2 truncate">
              Egresos
            </h3>
            <p className="text-sm sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
              ${stats.egresos.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 hidden sm:block">
              Este mes
            </p>
          </div>

          <div className="card !p-2.5 sm:!p-4 lg:!p-6">
            <h3 className="font-semibold text-[10px] sm:text-sm lg:text-base text-neutral-700 dark:text-neutral-300 mb-0.5 sm:mb-2 truncate">
              Pedidos
            </h3>
            <p className="text-sm sm:text-xl lg:text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats.totalPedidos}
            </p>
            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 hidden sm:block">
              Este mes
            </p>
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        {productosStockBajo.length > 0 && (
          <div className="card border-l-4 border-red-500 !p-3 sm:!p-4 lg:!p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Icons.ExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100">
                  Stock Bajo
                </h3>
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                  {productosStockBajo.length}
                </span>
              </div>
              <Link
                href="/clientes/stock"
                className="text-primary-600 dark:text-primary-400 hover:underline text-xs sm:text-sm self-end sm:self-auto"
              >
                Ver todo
              </Link>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {productosStockBajo.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate text-xs sm:text-sm">
                      {item.Producto?.nombre ||
                        item.producto?.nombre ||
                        "Producto"}
                    </p>
                    <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                      Mín: {item.stockMinimo || 10}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                      {item.cantidad || item.stock || 0}
                    </p>
                    <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                      uds
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {productosStockBajo.length > 6 && (
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 sm:mt-3 text-center">
                +{productosStockBajo.length - 6} más
              </p>
            )}
          </div>
        )}

        {/* Recent Orders & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 card !p-3 sm:!p-4 lg:!p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100">
                Últimos Pedidos
              </h3>
              <Link
                href="/clientes/pedidos"
                className="text-primary-600 dark:text-primary-400 hover:underline text-xs sm:text-sm"
              >
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[320px]">
                <thead>
                  <tr className="text-left text-neutral-500 dark:text-neutral-400 text-[10px] sm:text-xs border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-2 sm:pb-3 px-3 sm:px-0">ID</th>
                    <th className="pb-2 sm:pb-3 hidden sm:table-cell">Fecha</th>
                    <th className="pb-2 sm:pb-3">Depósito</th>
                    <th className="pb-2 sm:pb-3 text-right">Total</th>
                    <th className="pb-2 sm:pb-3 pr-3 sm:pr-0 text-right">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="border-b border-neutral-200 dark:border-neutral-700 last:border-0 text-xs sm:text-sm"
                    >
                      <td className="py-2 sm:py-3 px-3 sm:px-0 font-medium text-neutral-800 dark:text-neutral-100">
                        #{pedido.id}
                      </td>
                      <td className="py-2 sm:py-3 text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">
                        {pedido.fecha}
                      </td>
                      <td className="py-2 sm:py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[80px] sm:max-w-[120px]">
                        {pedido.deposito}
                      </td>
                      <td className="py-2 sm:py-3 font-medium text-neutral-800 dark:text-neutral-100 text-right">
                        ${pedido.total.toLocaleString()}
                      </td>
                      <td className="py-2 sm:py-3 pr-3 sm:pr-0 text-right">
                        <EstadoBadge estado={pedido.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ultimosPedidos.length === 0 && (
              <p className="text-center text-neutral-500 dark:text-neutral-400 py-6 text-sm">
                No hay pedidos recientes
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card !p-3 sm:!p-4 lg:!p-6">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 mb-3 sm:mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icons.Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                  Nuevo Pedido
                </span>
              </Link>
              <Link
                href="/clientes/depositos"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icons.Building className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <span className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                  Depósitos
                </span>
              </Link>
              <Link
                href="/clientes/pedidos"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icons.ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <span className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                  Mis Pedidos
                </span>
              </Link>
              <Link
                href="/clientes/contabilidad"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icons.Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                  Contabilidad
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Calificar */}
        <CalificarSection colorPrimary="primary" />

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
