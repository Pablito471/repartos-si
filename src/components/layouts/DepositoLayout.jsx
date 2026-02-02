import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDeposito } from "@/context/DepositoContext";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    href: "/depositos",
    icon: "📊",
  },
  {
    name: "Pedidos",
    href: "/depositos/pedidos",
    icon: "📦",
  },
  {
    name: "Inventario",
    href: "/depositos/inventario",
    icon: "📋",
  },
  {
    name: "Envíos",
    href: "/depositos/envios",
    icon: "🚚",
  },
  {
    name: "Contabilidad",
    href: "/depositos/contabilidad",
    icon: "💰",
  },
  {
    name: "Notificaciones",
    href: "/depositos/notificaciones",
    icon: "🔔",
  },
  {
    name: "Configuración",
    href: "/depositos/configuracion",
    icon: "⚙️",
  },
];

export default function DepositoLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const { getNotificacionesNoLeidas, getEstadisticas } = useDeposito();

  const notificacionesNoLeidas = getNotificacionesNoLeidas();
  const stats = getEstadisticas();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏭</span>
            <span className="text-xl font-bold text-white">Depósito</span>
          </Link>
        </div>

        {/* Deposit info */}
        <Link
          href="/depositos/perfil"
          className="block p-4 border-b border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
              {usuario?.foto ? (
                <img
                  src={usuario.foto}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                usuario?.nombre?.charAt(0).toUpperCase() || "D"
              )}
            </div>
            <div>
              <p className="font-semibold text-white">
                {usuario?.nombre || "Depósito"}
              </p>
              <p className="text-sm text-gray-400">
                ID: {usuario?.id || "DEP-001"}
              </p>
            </div>
            <span className="ml-auto text-gray-400">✏️</span>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-400">Operativo</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/depositos" &&
                  router.pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-green-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-gray-700/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-white">
                {stats.pedidosPendientes}
              </p>
              <p className="text-xs text-gray-400">Pendientes</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-green-400">
                {stats.totalProductos}
              </p>
              <p className="text-xs text-gray-400">Productos</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-lg font-semibold text-gray-800 lg:hidden">
              Panel de Depósito
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Alerts */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <span className="text-xl">⚠️</span>
              {stats.productosStockBajo > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications */}
            <Link
              href="/depositos/notificaciones"
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="text-xl">🔔</span>
              {notificacionesNoLeidas.length > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {notificacionesNoLeidas.length > 9
                    ? "9+"
                    : notificacionesNoLeidas.length}
                </span>
              )}
            </Link>

            {/* User */}
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                👤
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
