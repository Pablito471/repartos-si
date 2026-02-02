import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

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
    if (formData.password.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "La contraseña debe tener al menos 6 caracteres",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🚚 Repartos-SI</h1>
          <p className="text-white/80">Crea tu cuenta</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Indicador de pasos */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                paso >= 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${paso >= 2 ? "bg-blue-500" : "bg-gray-200"}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                paso >= 2
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>

          {/* Paso 1: Selección de tipo */}
          {paso === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                ¿Qué tipo de usuario eres?
              </h2>
              <p className="text-gray-500 text-center mb-6">
                Selecciona el tipo de cuenta que deseas crear
              </p>

              <div className="space-y-3">
                {tiposUsuario.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => seleccionarTipo(tipo.value)}
                    className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all hover:shadow-md ${
                      formData.tipoUsuario === tipo.value
                        ? `border-${tipo.color}-500 bg-${tipo.color}-50`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-4xl">{tipo.icon}</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">
                        {tipo.label}
                      </p>
                      <p className="text-sm text-gray-500">
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
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Registro como{" "}
                    {
                      tiposUsuario.find((t) => t.value === formData.tipoUsuario)
                        ?.label
                    }
                  </h2>
                  <p className="text-sm text-gray-500">
                    Completa tus datos para crear tu cuenta
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.tipoUsuario === "deposito"
                        ? "Nombre del depósito"
                        : "Tu nombre"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar *
                    </label>
                    <input
                      type="password"
                      name="confirmarPassword"
                      value={formData.confirmarPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="11-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle, número, ciudad"
                  />
                </div>

                {formData.tipoUsuario === "flete" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Licencia
                    </label>
                    <select
                      name="licencia"
                      value={formData.licencia}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {cargando ? "Registrando..." : "Crear Cuenta"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Inicia sesión
              </Link>
            </p>
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
