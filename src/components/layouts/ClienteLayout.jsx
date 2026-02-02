import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber } from "@/utils/formatters";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

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

        {/* User info */}
        <Link
          href="/clientes/perfil"
          className="block p-4 border-b border-primary-600 dark:border-primary-700 bg-primary-800/50 hover:bg-primary-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
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
            <div>
              <p className="font-semibold text-white">
                {usuario?.nombre || "Cliente"}
              </p>
              <p className="text-sm text-primary-200">
                {usuario?.id || "Cliente"}
              </p>
            </div>
            <span className="ml-auto text-primary-300">
              <Icons.Pencil className="w-4 h-4" />
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.href;
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
              Panel de Cliente
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart indicator */}
            {cantidadCarrito > 0 && (
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center space-x-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
              >
                <div className="relative">
                  <span className="text-xl">🛒</span>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 dark:bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cantidadCarrito}
                  </span>
                </div>
                <span className="hidden md:inline text-primary-700 dark:text-primary-400 font-medium">
                  ${formatNumber(totalCarrito)}
                </span>
              </Link>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Help */}
            <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <span className="text-xl">❓</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
