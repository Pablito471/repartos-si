import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionContext";
import { formatNumber } from "@/utils/formatters";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";
import NotificacionesPanel from "@/components/NotificacionesPanel";

const menuItems = [
  {
    name: "Dashboard",
    href: "/clientes",
    icon: "ChartBar",
  },
  {
    name: "Depósitos",
    href: "/clientes/depositos",
    icon: "Building",
  },
  {
    name: "Mis Pedidos",
    href: "/clientes/pedidos",
    icon: "Package",
  },
  {
    name: "Nuevo Pedido",
    href: "/clientes/pedidos/nuevo",
    icon: "Plus",
  },
  {
    name: "Mi Stock",
    href: "/clientes/stock",
    icon: "ClipboardList",
  },
  {
    name: "Contabilidad",
    href: "/clientes/contabilidad",
    icon: "Wallet",
  },
];

export default function ClienteLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const {
    getCantidadCarrito,
    getTotalCarrito,
    carrito,
    depositos,
    getDepositosEnCarrito,
  } = useCliente();

  const cantidadCarrito = getCantidadCarrito();
  const totalCarrito = getTotalCarrito();
  const depositosEnCarrito = getDepositosEnCarrito();

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

        {/* User info */}
        <Link
          href="/clientes/perfil"
          className="flex-shrink-0 block p-3 border-b border-primary-600 dark:border-primary-700 bg-primary-800/50 hover:bg-primary-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {usuario?.foto ? (
                <img
                  src={usuario.foto}
                  alt="Foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                usuario?.nombre?.charAt(0).toUpperCase() || "C"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">
                {usuario?.nombre || "Cliente"}
              </p>
              <p className="text-xs text-primary-200">
                {usuario?.id || "Cliente"}
              </p>
            </div>
            <span className="flex-shrink-0 text-primary-300">
              <Icons.Pencil className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white text-primary-700"
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
              Panel Cliente
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart indicator */}
            {cantidadCarrito > 0 && (
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
              >
                <div className="relative">
                  <Icons.ShoppingCart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-primary-600 dark:bg-primary-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                    {cantidadCarrito}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm text-primary-700 dark:text-primary-400 font-medium">
                  ${formatNumber(totalCarrito)}
                </span>
              </Link>
            )}

            {/* Notifications */}
            <NotificacionesPanel />

            {/* Help - hidden on mobile */}
            <button
              className="hidden sm:block p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Ayuda"
            >
              <Icons.QuestionMarkCircle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
