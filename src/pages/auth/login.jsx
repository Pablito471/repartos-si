import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Swal from "sweetalert2";

export default function Login() {
  const router = useRouter();
  const { login, estaAutenticado, getRutaInicio } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [cargando, setCargando] = useState(false);

  // Redirigir si ya está autenticado
  if (estaAutenticado) {
    router.push(getRutaInicio());
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    const resultado = await login(formData.email, formData.password);

    if (resultado.success) {
      Swal.fire({
        icon: "success",
        title: `¡Bienvenido, ${resultado.usuario.nombre}!`,
        text: "Iniciando sesión...",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        const rutas = {
          cliente: "/clientes",
          deposito: "/depositos",
          flete: "/fletes",
          admin: "/admin",
        };
        router.push(rutas[resultado.usuario.tipoUsuario] || "/");
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: resultado.error,
      });
    }

    setCargando(false);
  };

  const loginRapido = async (tipo) => {
    const credenciales = {
      cliente: { email: "cliente@test.com", password: "123456" },
      deposito: { email: "deposito@test.com", password: "123456" },
      flete: { email: "flete@test.com", password: "123456" },
    };

    setFormData(credenciales[tipo]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="xl" />
          <p className="text-white/80 dark:text-neutral-400 mt-3">
            Sistema de Gestión de Repartos
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl dark:shadow-neutral-900/50 p-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 text-center mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              ¿No tienes cuenta?{" "}
              <Link
                href="/auth/registro"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Login Rápido (para testing) */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-3">
              Acceso rápido (demo):
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loginRapido("cliente")}
                className="flex-1 py-2 px-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                👤 Cliente
              </button>
              <button
                type="button"
                onClick={() => loginRapido("deposito")}
                className="flex-1 py-2 px-3 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded-lg text-sm font-medium hover:bg-secondary-200 dark:hover:bg-secondary-900/50 transition-colors"
              >
                🏪 Depósito
              </button>
              <button
                type="button"
                onClick={() => loginRapido("flete")}
                className="flex-1 py-2 px-3 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 rounded-lg text-sm font-medium hover:bg-accent-200 dark:hover:bg-accent-900/50 transition-colors"
              >
                🚚 Flete
              </button>
            </div>

            {/* Botón restaurar datos */}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("repartos_usuarios");
                localStorage.removeItem("repartos_usuario_actual");
                Swal.fire({
                  icon: "success",
                  title: "Datos restaurados",
                  text: "Se han restaurado las cuentas de prueba",
                  timer: 1500,
                  showConfirmButton: false,
                }).then(() => {
                  window.location.reload();
                });
              }}
              className="w-full mt-3 py-2 px-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              🔄 Restaurar datos de prueba
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 dark:text-neutral-500 mt-6 text-sm">
          © 2026 Repartos-SI. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
