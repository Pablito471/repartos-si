import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

// Validar fortaleza de contraseña
const validarFortalezaPassword = (password) => {
  const errores = [];

  if (password.length < 8) {
    errores.push("8 caracteres");
  }
  if (!/[A-Z]/.test(password)) {
    errores.push("mayúscula");
  }
  if (!/[a-z]/.test(password)) {
    errores.push("minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errores.push("número");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errores.push("especial");
  }

  return {
    valido: errores.length === 0,
    errores,
    fortaleza: Math.max(0, 5 - errores.length),
  };
};

export default function Registro() {
  const router = useRouter();
  const { registro, estaAutenticado, getRutaInicio } = useAuth();
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState({
    tipoUsuario: "",
    nombre: "",
    email: "",
    password: "",
    confirmarPassword: "",
    telefono: "",
    direccion: "",
    licencia: "",
  });
  const [cargando, setCargando] = useState(false);

  // Validar fortaleza de password en tiempo real
  const validacionPassword = useMemo(() => {
    return validarFortalezaPassword(formData.password);
  }, [formData.password]);

  const getFortalezaColor = () => {
    if (validacionPassword.fortaleza <= 1) return "bg-red-500";
    if (validacionPassword.fortaleza <= 2) return "bg-orange-500";
    if (validacionPassword.fortaleza <= 3) return "bg-yellow-500";
    if (validacionPassword.fortaleza <= 4) return "bg-lime-500";
    return "bg-green-500";
  };

  // Redirigir si ya está autenticado
  if (estaAutenticado) {
    router.push(getRutaInicio());
    return null;
  }

  const tiposUsuario = [
    {
      value: "cliente",
      label: "Cliente",
      icon: "👤",
      color: "blue",
      descripcion: "Compra productos de los depósitos",
    },
    {
      value: "deposito",
      label: "Depósito",
      icon: "🏪",
      color: "green",
      descripcion: "Vende y gestiona inventario",
    },
    {
      value: "flete",
      label: "Transportista",
      icon: "🚚",
      color: "orange",
      descripcion: "Realiza entregas y repartos",
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const seleccionarTipo = (tipo) => {
    setFormData({ ...formData, tipoUsuario: tipo });
    setPaso(2);
  };

  const validarPaso2 = () => {
    if (!formData.nombre.trim()) {
      Swal.fire({ icon: "error", title: "Error", text: "Ingresa tu nombre" });
      return false;
    }
    if (!formData.email.trim()) {
      Swal.fire({ icon: "error", title: "Error", text: "Ingresa tu email" });
      return false;
    }

    // Validar fortaleza de contraseña
    const validacion = validarFortalezaPassword(formData.password);
    if (!validacion.valido) {
      Swal.fire({
        icon: "error",
        title: "Contraseña insegura",
        html: `La contraseña debe incluir: ${validacion.errores.join(", ")}`,
      });
      return false;
    }

    if (formData.password !== formData.confirmarPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarPaso2()) return;

    setCargando(true);

    const resultado = await registro(formData);

    if (resultado.success) {
      Swal.fire({
        icon: "success",
        title: "¡Registro exitoso!",
        text: `Bienvenido a Repartos-SI, ${resultado.usuario.nombre}`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        const rutas = {
          cliente: "/clientes",
          deposito: "/depositos",
          flete: "/fletes",
        };
        router.push(rutas[resultado.usuario.tipoUsuario]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Botón volver */}
      <Link
        href="/"
        className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white transition-all"
      >
        <Icons.ChevronLeft className="w-5 h-5" />
      </Link>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Logo size="xl" />
          </div>
          <p className="text-white/80 dark:text-neutral-400">Crea tu cuenta</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl dark:shadow-neutral-900/50 p-8 transition-colors duration-300">
          {/* Indicador de pasos */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                paso >= 1
                  ? "bg-primary-600 dark:bg-primary-500 text-white"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${paso >= 2 ? "bg-primary-600 dark:bg-primary-500" : "bg-neutral-200 dark:bg-neutral-700"}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                paso >= 2
                  ? "bg-primary-600 dark:bg-primary-500 text-white"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              2
            </div>
          </div>

          {/* Paso 1: Selección de tipo */}
          {paso === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 text-center mb-2">
                ¿Qué tipo de usuario eres?
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-center mb-6">
                Selecciona el tipo de cuenta que deseas crear
              </p>

              <div className="space-y-3">
                {tiposUsuario.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => seleccionarTipo(tipo.value)}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all hover:shadow-md ${
                      formData.tipoUsuario === tipo.value
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 dark:bg-neutral-800"
                    }`}
                  >
                    <span className="text-4xl">{tipo.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {tipo.label}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {tipo.descripcion}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 2: Datos de registro */}
          {paso === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-700 dark:text-neutral-300"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                    Registro como{" "}
                    {
                      tiposUsuario.find((t) => t.value === formData.tipoUsuario)
                        ?.label
                    }
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Completa tus datos para crear tu cuenta
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder={
                      formData.tipoUsuario === "deposito"
                        ? "Nombre del depósito"
                        : "Tu nombre"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      placeholder="••••••••"
                      required
                    />
                    {/* Indicador de fortaleza */}
                    {formData.password && (
                      <div className="mt-1.5">
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((nivel) => (
                            <div
                              key={nivel}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                nivel <= validacionPassword.fortaleza
                                  ? getFortalezaColor()
                                  : "bg-neutral-200 dark:bg-neutral-600"
                              }`}
                            />
                          ))}
                        </div>
                        {!validacionPassword.valido && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Falta: {validacionPassword.errores.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Confirmar *
                    </label>
                    <input
                      type="password"
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      placeholder="••••••••"
                      required
                    />
                    {/* Indicador de coincidencia */}
                    {formData.confirmarPassword && (
                      <p
                        className={`text-xs mt-1 ${
                          formData.password === formData.confirmarPassword
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {formData.password === formData.confirmarPassword
                          ? "✓ Coinciden"
                          : "✗ No coinciden"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder="11-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    placeholder="Calle, número, ciudad"
                  />
                </div>

                {formData.tipoUsuario === "flete" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Tipo de Licencia
                    </label>
                    <select
                      name="licencia"
                      value={formData.licencia}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="B1">B1 - Automóviles</option>
                      <option value="B2">B2 - Camionetas</option>
                      <option value="C">C - Camiones</option>
                      <option value="D">D - Transporte de pasajeros</option>
                      <option value="E">E - Vehículos pesados</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all disabled:opacity-50"
                >
                  {cargando ? "Registrando..." : "Crear Cuenta"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Inicia sesión
              </Link>
            </p>
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
