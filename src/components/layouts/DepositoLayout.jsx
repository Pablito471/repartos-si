import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDeposito } from "@/context/DepositoContext";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

const menuItems = [
  {
    name: "Dashboard",
    href: "/depositos",
    icon: "ChartBar",
  },
  {
    name: "Pedidos",
    href: "/depositos/pedidos",
    icon: "Package",
  },
  {
    name: "Inventario",
    href: "/depositos/inventario",
    icon: "ClipboardList",
  },
  {
    name: "Envíos",
    href: "/depositos/envios",
    icon: "Truck",
  },
  {
    name: "Contabilidad",
    href: "/depositos/contabilidad",
    icon: "Wallet",
  },
  {
    name: "Notificaciones",
    href: "/depositos/notificaciones",
    icon: "Bell",
  },
  {
    name: "Configuración",
    href: "/depositos/configuracion",
    icon: "Cog",
  },
];

export default function DepositoLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const { getNotificacionesNoLeidas, getEstadisticas } = useDeposito();

  const notificacionesNoLeidas = getNotificacionesNoLeidas();
  const stats = getEstadisticas();

  // Render icon component from name
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-primary-700 to-primary-900 dark:from-primary-800 dark:to-primary-950 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-24 flex items-center justify-center border-b border-primary-600 dark:border-primary-700 py-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Deposit info */}
        <Link
          href="/depositos/perfil"
          className="block p-4 border-b border-primary-600 dark:border-primary-700 bg-primary-800/50 hover:bg-primary-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
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
              <p className="text-sm text-primary-200">
                ID: {usuario?.id || "DEP-001"}
              </p>
            </div>
            <span className="ml-auto text-primary-300">
              <Icons.Pencil className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-300">Operativo</span>
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
                        ? "bg-primary-500 text-white"
                        : "text-primary-100 hover:bg-primary-600 hover:text-white"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats */}
        <div className="absolute bottom-16 left-0 right-0 p-4 border-t border-primary-600 dark:border-primary-700">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-primary-800/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-white">
                {stats.pedidosPendientes}
              </p>
              <p className="text-xs text-primary-300">Pendientes</p>
            </div>
            <div className="bg-primary-800/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-primary-300">
                {stats.totalProductos}
              </p>
              <p className="text-xs text-primary-300">Productos</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-600 dark:border-primary-700">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-primary-100 hover:bg-primary-600 hover:text-white rounded-lg transition-colors"
          >
            <Icons.Logout className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="h-16 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 flex items-center justify-between px-4 lg:px-8 transition-colors duration-300">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6 text-neutral-700 dark:text-neutral-300"
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
            <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 lg:hidden">
              Panel de Depósito
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Alerts */}
            <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <span className="text-xl">⚠️</span>
              {stats.productosStockBajo > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications */}
            <Link
              href="/depositos/notificaciones"
              className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
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
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-neutral-200 dark:border-neutral-700">
              <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                👤
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
