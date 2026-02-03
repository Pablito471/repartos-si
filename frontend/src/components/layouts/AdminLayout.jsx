import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "ChartBar",
  },
  {
    name: "Gestión de Usuarios",
    href: "/admin/usuarios",
    icon: "Users",
  },
  {
    name: "Calificaciones",
    href: "/admin/calificaciones",
    icon: "Star",
  },
  {
    name: "Cuentas Desactivadas",
    href: "/admin/desactivados",
    icon: "Ban",
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout, esAdmin, cargando } = useAuth();

  // Render icon component from name
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  // Proteger ruta - solo admin
  useEffect(() => {
    if (!cargando && (!usuario || usuario.tipoUsuario !== "admin")) {
      router.push("/auth/login");
    }
  }, [usuario, cargando, router]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!esAdmin) {
    return null;
  }

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
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gradient-to-b from-primary-800 to-primary-950 dark:from-primary-900 dark:to-neutral-950 shadow-lg transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex-shrink-0 flex items-center justify-center border-b border-primary-700 py-3">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Admin info */}
        <div className="flex-shrink-0 p-3 border-b border-primary-700 bg-primary-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
              <Icons.Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">
                {usuario?.nombre || "Admin"}
              </p>
              <p className="text-xs text-primary-300">Super Administrador</p>
            </div>
          </div>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/admin" &&
                  router.pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-primary-200 hover:bg-primary-700 hover:text-white"
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

        {/* Warning */}
        <div className="flex-shrink-0 px-3 pb-2">
          <div className="bg-primary-900/50 border border-primary-600 rounded-lg p-2">
            <p className="text-primary-300 text-[10px] text-center flex items-center justify-center gap-1">
              <Icons.Alert className="w-3 h-3" /> Zona restringida. Acciones
              registradas.
            </p>
          </div>
        </div>

        {/* Logout */}
        <div className="flex-shrink-0 p-3 border-t border-primary-700">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-primary-200 hover:bg-primary-700 hover:text-white rounded-lg transition-colors"
          >
            <Icons.Logout className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top navbar */}
        <header className="h-14 sm:h-16 bg-white dark:bg-neutral-800 shadow-sm dark:shadow-neutral-900/30 flex items-center justify-between px-3 sm:px-4 lg:px-8 border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-300 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white -ml-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h1 className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-white lg:hidden truncate">
              Admin Panel
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            <span className="hidden md:flex items-center gap-1 text-neutral-500 dark:text-neutral-400 text-sm">
              <Icons.Lock className="w-4 h-4" /> Sesión segura
            </span>
            <div className="px-2 sm:px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
              ADMIN
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
