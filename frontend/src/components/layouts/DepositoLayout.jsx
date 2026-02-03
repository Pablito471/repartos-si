import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useDeposito } from "@/context/DepositoContext";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";
import NotificacionesPanel from "@/components/NotificacionesPanel";

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
    name: "Fletes",
    href: "/depositos/fletes",
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
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-primary-700 to-primary-900 dark:from-primary-800 dark:to-primary-950 shadow-lg transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex-shrink-0 flex items-center justify-center border-b border-primary-600 dark:border-primary-700 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Deposit info */}
        <Link
          href="/depositos/perfil"
          className="flex-shrink-0 block p-3 border-b border-primary-600 dark:border-primary-700 bg-primary-800/50 hover:bg-primary-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
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
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">
                {usuario?.nombre || "Depósito"}
              </p>
              <p className="text-xs text-primary-200">
                ID: {usuario?.id || "DEP-001"}
              </p>
            </div>
            <span className="flex-shrink-0 text-primary-300">
              <Icons.Pencil className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-300">Operativo</span>
          </div>
        </Link>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/depositos" &&
                  router.pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary-500 text-white"
                        : "text-primary-100 hover:bg-primary-600 hover:text-white"
                    }`}
                  >
                    {renderIcon(item.icon)}
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats - fixed at bottom */}
        <div className="flex-shrink-0 p-3 border-t border-primary-600 dark:border-primary-700">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-primary-800/50 rounded-lg p-2">
              <p className="text-xl font-bold text-white">
                {stats.pedidosPendientes}
              </p>
              <p className="text-[10px] text-primary-300">Pendientes</p>
            </div>
            <div className="bg-primary-800/50 rounded-lg p-2">
              <p className="text-xl font-bold text-primary-300">
                {stats.totalProductos}
              </p>
              <p className="text-[10px] text-primary-300">Productos</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="flex-shrink-0 p-3 border-t border-primary-600 dark:border-primary-700">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-primary-100 hover:bg-primary-600 hover:text-white rounded-lg transition-colors"
          >
            <Icons.Logout className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top navbar */}
        <header className="h-14 sm:h-16 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 flex items-center justify-between px-3 sm:px-4 lg:px-8 transition-colors duration-300 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 -ml-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Icons.Menu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-neutral-100 lg:hidden truncate">
              Panel Depósito
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Alerts */}
            <button
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Alertas"
            >
              <Icons.Alert className="w-5 h-5 text-amber-500" />
              {stats.productosStockBajo > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications */}
            <NotificacionesPanel />

            {/* User */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-neutral-200 dark:border-neutral-700">
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                <Icons.User className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
