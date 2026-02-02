import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="xl" variant="white" />
          <p className="text-white/80 mt-3">Sistema de Gestión de Repartos</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link
                href="/auth/registro"
                className="text-blue-600 hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Login Rápido (para testing) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              Acceso rápido (demo):
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loginRapido("cliente")}
                className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                👤 Cliente
              </button>
              <button
                type="button"
                onClick={() => loginRapido("deposito")}
                className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                🏪 Depósito
              </button>
              <button
                type="button"
                onClick={() => loginRapido("flete")}
                className="flex-1 py-2 px-3 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
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
              className="w-full mt-3 py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              🔄 Restaurar datos de prueba
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 mt-6 text-sm">
          © 2026 Repartos-SI. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
