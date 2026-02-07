import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";
import Swal from "sweetalert2";
import { authService } from "@/services/api";

export default function RecuperarPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Por favor ingresa tu email",
      });
      return;
    }

    setCargando(true);

    try {
      await authService.solicitarRecuperacion(email);
      setEnviado(true);
      Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.",
      });
    } catch (error) {
      // Incluso si hay error, mostramos mensaje genérico por seguridad
      setEnviado(true);
      Swal.fire({
        icon: "info",
        title: "Solicitud procesada",
        text: "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.",
      });
    }

    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center p-4">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300/20 dark:bg-primary-800/20 rounded-full blur-3xl"></div>
      </div>

      {/* Toggle tema */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card principal */}
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-neutral-700/50 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16" />
          </div>

          <h1 className="text-2xl font-bold text-center text-neutral-800 dark:text-white mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
            {enviado
              ? "Te hemos enviado un email con instrucciones"
              : "Ingresa tu email para recibir un enlace de recuperación"}
          </p>

          {!enviado ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Email className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cargando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Icons.Email className="h-5 w-5" />
                    <span>Enviar enlace</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Icons.Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                Revisa tu bandeja de entrada y sigue las instrucciones del
                email.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                El enlace expirará en 1 hora.
              </p>
            </div>
          )}

          {/* Link a login */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
