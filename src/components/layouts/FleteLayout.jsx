import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useFlete } from "@/context/FleteContext";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const menuItems = [
  {
    name: "Dashboard",
    href: "/fletes",
    icon: "📊",
  },
  {
    name: "Mis Envíos",
    href: "/fletes/envios",
    icon: "📦",
  },
  {
    name: "Ruta del Día",
    href: "/fletes/ruta",
    icon: "🗺️",
  },
  {
    name: "Historial",
    href: "/fletes/historial",
    icon: "📋",
  },
  {
    name: "Contabilidad",
    href: "/fletes/contabilidad",
    icon: "💰",
  },
  {
    name: "Mi Vehículo",
    href: "/fletes/vehiculo",
    icon: "🚚",
  },
];

export default function FleteLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const { getNotificacionesNoLeidas, getEstadisticas } = useFlete();

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
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-orange-600 to-orange-800 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-orange-500">
          <Link href="/">
            <Logo size="sm" variant="white" />
          </Link>
        </div>

        {/* Driver info */}
        <Link
          href="/fletes/perfil"
          className="block p-4 border-b border-orange-500 bg-orange-700/50 hover:bg-orange-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600 font-bold overflow-hidden">
              {usuario?.foto ? (
                <img
                  src={usuario.foto}
                  alt="Foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                usuario?.nombre?.charAt(0).toUpperCase() || "F"
              )}
            </div>
            <div>
              <p className="font-semibold text-white">
                {usuario?.nombre || "Transportista"}
              </p>
              <p className="text-sm text-orange-200">
                ID: {usuario?.id || "FLT-001"}
              </p>
            </div>
            <span className="ml-auto text-orange-200">✏️</span>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-300">Disponible</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/fletes" &&
                  router.pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white text-orange-600"
                        : "text-orange-100 hover:bg-orange-700 hover:text-white"
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
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-orange-500">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-orange-700/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-white">
                {stats.enviosPendientes}
              </p>
              <p className="text-xs text-orange-200">Pendientes</p>
            </div>
            <div className="bg-orange-700/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-green-300">
                {stats.enviosEntregados}
              </p>
              <p className="text-xs text-orange-200">Entregados</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-orange-500">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-orange-100 hover:bg-orange-700 hover:text-white rounded-lg transition-colors"
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
              Panel de Flete
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Today's deliveries */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
              <span className="text-orange-600 font-medium">
                {stats.enviosHoy} envíos hoy
              </span>
            </div>

            {/* Notifications */}
            <Link
              href="/fletes/notificaciones"
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
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                JC
              </div>
              <span className="text-sm font-medium text-gray-700">Juan</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
