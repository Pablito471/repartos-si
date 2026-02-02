import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useFlete } from "@/context/FleteContext";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

const menuItems = [
  {
    name: "Dashboard",
    href: "/fletes",
    icon: "ChartBar",
  },
  {
    name: "Mis Entregas",
    href: "/fletes/envios",
    icon: "Package",
  },
  {
    name: "Ruta del Día",
    href: "/fletes/ruta",
    icon: "Map",
  },
  {
    name: "Historial",
    href: "/fletes/historial",
    icon: "ClipboardList",
  },
  {
    name: "Contabilidad",
    href: "/fletes/contabilidad",
    icon: "Wallet",
  },
];

export default function FleteLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const { getNotificacionesNoLeidas, getEstadisticas } = useFlete();

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

        {/* Driver info */}
        <Link
          href="/fletes/perfil"
          className="block p-4 border-b border-primary-600 dark:border-primary-700 bg-primary-800/50 hover:bg-primary-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold overflow-hidden">
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
              <p className="text-sm text-primary-200">
                ID: {usuario?.id || "FLT-001"}
              </p>
            </div>
            <span className="ml-auto text-primary-300">
              <Icons.Pencil className="w-4 h-4" />
            </span>
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
                        ? "bg-white text-primary-700"
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
                {stats.enviosPendientes}
              </p>
              <p className="text-xs text-primary-200">Pendientes</p>
            </div>
            <div className="bg-primary-800/50 rounded-lg p-2">
              <p className="text-2xl font-bold text-green-300">
                {stats.enviosEntregados}
              </p>
              <p className="text-xs text-primary-200">Entregados</p>
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
              Panel de Flete
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Today's deliveries */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <span className="text-primary-700 dark:text-primary-400 font-medium">
                {stats.enviosHoy} envíos hoy
              </span>
            </div>

            {/* Notifications */}
            <Link
              href="/fletes/notificaciones"
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
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                JC
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Juan
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
