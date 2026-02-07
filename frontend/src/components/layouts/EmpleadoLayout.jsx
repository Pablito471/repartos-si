import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import Link from "next/link";

export default function EmpleadoLayout({ children }) {
  const router = useRouter();
  const { usuario, logout, estaAutenticado, cargando } = useAuth();

  useEffect(() => {
    if (!cargando && !estaAutenticado) {
      router.push("/auth/login");
    }
    if (!cargando && estaAutenticado && usuario?.tipoUsuario !== "empleado") {
      router.push("/");
    }
  }, [cargando, estaAutenticado, usuario, router]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!estaAutenticado || usuario?.tipoUsuario !== "empleado") {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header simple */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {usuario?.nombre}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Empleado •{" "}
                {usuario?.tipoEmpleador === "deposito" ? "Depósito" : "Cliente"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
