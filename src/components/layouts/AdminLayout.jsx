import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "📊",
  },
  {
    name: "Gestión de Usuarios",
    href: "/admin/usuarios",
    icon: "👥",
  },
  {
    name: "Calificaciones",
    href: "/admin/calificaciones",
    icon: "⭐",
  },
  {
    name: "Cuentas Desactivadas",
    href: "/admin/desactivados",
    icon: "🚫",
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout, esAdmin, cargando } = useAuth();

  // Proteger ruta - solo admin
  useEffect(() => {
    if (!cargando && (!usuario || usuario.tipoUsuario !== "admin")) {
      router.push("/auth/login");
    }
  }, [usuario, cargando, router]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!esAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-red-900 to-gray-900 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-red-800">
          <Link href="/admin">
            <Logo size="sm" variant="white" />
          </Link>
        </div>

        {/* Admin info */}
        <div className="p-4 border-b border-red-800 bg-red-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              👑
            </div>
            <div>
              <p className="font-semibold text-white">
                {usuario?.nombre || "Admin"}
              </p>
              <p className="text-sm text-red-300">Super Administrador</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/admin" &&
                  router.pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-red-600 text-white"
                        : "text-red-100 hover:bg-red-800 hover:text-white"
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

        {/* Warning */}
        <div className="absolute bottom-20 left-0 right-0 p-4">
          <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-300 text-xs text-center">
              ⚠️ Zona restringida. Todas las acciones son registradas.
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-red-800">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-200 hover:bg-red-800 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="h-16 bg-gray-800 shadow-sm flex items-center justify-between px-4 lg:px-8 border-b border-gray-700">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-700 text-white"
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
            <h1 className="text-lg font-semibold text-white lg:hidden">
              Admin Panel
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:block text-gray-400 text-sm">
              🔒 Sesión segura
            </span>
            <div className="px-3 py-1 bg-red-900 text-red-300 rounded-full text-xs font-medium">
              ADMIN
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
