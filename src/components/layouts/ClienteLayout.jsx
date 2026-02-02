import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber } from "@/utils/formatters";

const menuItems = [
  {
    name: "Dashboard",
    href: "/clientes",
    icon: "📊",
  },
  {
    name: "Depósitos",
    href: "/clientes/depositos",
    icon: "🏭",
  },
  {
    name: "Mis Pedidos",
    href: "/clientes/pedidos",
    icon: "📦",
  },
  {
    name: "Nuevo Pedido",
    href: "/clientes/pedidos/nuevo",
    icon: "➕",
  },
  {
    name: "Contabilidad",
    href: "/clientes/contabilidad",
    icon: "💰",
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
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🚚</span>
            <span className="text-xl font-bold text-primary">Repartos SI</span>
          </Link>
        </div>

        {/* User info */}
        <Link
          href="/clientes/perfil"
          className="block p-4 border-b bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
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
              <p className="font-semibold text-gray-800">
                {usuario?.nombre || "Cliente"}
              </p>
              <p className="text-sm text-gray-500">
                {usuario?.id || "Cliente"}
              </p>
            </div>
            <span className="ml-auto text-gray-400">✏️</span>
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
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
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

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
              Panel de Cliente
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart indicator */}
            {cantidadCarrito > 0 && (
              <Link
                href="/clientes/pedidos/nuevo"
                className="flex items-center space-x-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <div className="relative">
                  <span className="text-xl">🛒</span>
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cantidadCarrito}
                  </span>
                </div>
                <span className="hidden md:inline text-primary font-medium">
                  ${formatNumber(totalCarrito)}
                </span>
              </Link>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Help */}
            <button className="p-2 rounded-lg hover:bg-gray-100">
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
