import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";
import Swal from "sweetalert2";
import { authService } from "@/services/api";

// Validar fortaleza de contraseña (misma lógica que backend)
const validarFortalezaPassword = (password) => {
  const errores = [];

  if (password.length < 8) {
    errores.push("Al menos 8 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errores.push("Una letra mayúscula");
  }
  if (!/[a-z]/.test(password)) {
    errores.push("Una letra minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errores.push("Un número");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errores.push("Un carácter especial (!@#$%^&*...)");
  }

  return {
    valido: errores.length === 0,
    errores,
    fortaleza: Math.max(0, 5 - errores.length),
  };
};

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [formData, setFormData] = useState({
    password: "",
    confirmar: "",
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [validacion, setValidacion] = useState({
    valido: false,
    errores: [],
    fortaleza: 0,
  });

  useEffect(() => {
    if (formData.password) {
      setValidacion(validarFortalezaPassword(formData.password));
    } else {
      setValidacion({ valido: false, errores: [], fortaleza: 0 });
    }
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Token inválido",
        text: "El enlace de recuperación no es válido. Solicita uno nuevo.",
      });
      return;
    }

    if (formData.password !== formData.confirmar) {
      Swal.fire({
        icon: "warning",
        title: "Las contraseñas no coinciden",
        text: "Por favor verifica que ambas contraseñas sean iguales",
      });
      return;
    }

    if (!validacion.valido) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña insegura",
        html: `La contraseña debe incluir:<br>• ${validacion.errores.join("<br>• ")}`,
      });
      return;
    }

    setCargando(true);

    try {
      await authService.resetPassword(token, formData.password);
      setExito(true);
      Swal.fire({
        icon: "success",
        title: "¡Contraseña actualizada!",
        text: "Ya puedes iniciar sesión con tu nueva contraseña",
        confirmButtonText: "Ir al login",
      }).then(() => {
        router.push("/auth/login");
      });
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.message ||
        "Error al actualizar la contraseña";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
      });
    }

    setCargando(false);
  };

  const getFortalezaColor = () => {
    if (validacion.fortaleza <= 1) return "bg-red-500";
    if (validacion.fortaleza <= 2) return "bg-orange-500";
    if (validacion.fortaleza <= 3) return "bg-yellow-500";
    if (validacion.fortaleza <= 4) return "bg-lime-500";
    return "bg-green-500";
  };

  const getFortalezaTexto = () => {
    if (validacion.fortaleza <= 1) return "Muy débil";
    if (validacion.fortaleza <= 2) return "Débil";
    if (validacion.fortaleza <= 3) return "Regular";
    if (validacion.fortaleza <= 4) return "Buena";
    return "Excelente";
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
            Nueva Contraseña
          </h1>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6">
            Crea una contraseña segura para tu cuenta
          </p>

          {!exito ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {mostrarPassword ? (
                      <Icons.EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    ) : (
                      <Icons.Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    )}
                  </button>
                </div>

                {/* Indicador de fortaleza */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((nivel) => (
                        <div
                          key={nivel}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            nivel <= validacion.fortaleza
                              ? getFortalezaColor()
                              : "bg-neutral-200 dark:bg-neutral-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-xs ${
                        validacion.fortaleza <= 2
                          ? "text-red-500"
                          : validacion.fortaleza <= 3
                            ? "text-yellow-600"
                            : "text-green-500"
                      }`}
                    >
                      Fortaleza: {getFortalezaTexto()}
                    </p>
                  </div>
                )}

                {/* Requisitos */}
                {formData.password && !validacion.valido && (
                  <div className="mt-2 p-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Requisitos:
                    </p>
                    <ul className="text-xs space-y-0.5">
                      {[
                        "Al menos 8 caracteres",
                        "Una letra mayúscula",
                        "Una letra minúscula",
                        "Un número",
                        "Un carácter especial",
                      ].map((req, i) => {
                        const cumple = !validacion.errores.some((e) =>
                          e.includes(req.split(" ").slice(-2).join(" ")),
                        );
                        return (
                          <li
                            key={i}
                            className={`flex items-center gap-1 ${cumple ? "text-green-600 dark:text-green-400" : "text-neutral-500"}`}
                          >
                            {cumple ? (
                              <Icons.Check className="w-3 h-3" />
                            ) : (
                              <span className="w-3 h-3 text-center">•</span>
                            )}
                            {req}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="confirmar"
                    value={formData.confirmar}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {formData.confirmar &&
                  formData.password !== formData.confirmar && (
                    <p className="text-xs text-red-500 mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                {formData.confirmar &&
                  formData.password === formData.confirmar &&
                  formData.password && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <Icons.Check className="w-3 h-3" /> Las contraseñas
                      coinciden
                    </p>
                  )}
              </div>

              <button
                type="submit"
                disabled={
                  cargando ||
                  !validacion.valido ||
                  formData.password !== formData.confirmar
                }
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
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Icons.Lock className="h-5 w-5" />
                    <span>Establecer contraseña</span>
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
                Tu contraseña ha sido actualizada correctamente.
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
