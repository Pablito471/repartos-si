import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import Swal from "sweetalert2";
import Icons from "@/components/Icons";

export default function PerfilAdmin() {
  const { usuario, actualizarPerfil, actualizarFoto, cambiarPassword } =
    useAuth();

  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [formPassword, setFormPassword] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  // Cargar datos del usuario cuando esté disponible
  useEffect(() => {
    if (usuario) {
      setFormPerfil({
        nombre: usuario.nombre ?? "",
        telefono: usuario.telefono ?? "",
        email: usuario.email ?? "",
      });
    }
  }, [usuario]);

  const fileInputRef = useRef(null);

  const secciones = [
    { id: "perfil", label: "Datos Personales", icon: "User" },
    { id: "seguridad", label: "Seguridad", icon: "Lock" },
    { id: "actividad", label: "Actividad", icon: "ChartBar" },
  ];

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Archivo muy grande",
          text: "La imagen no debe superar los 2MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        setGuardando(true);
        try {
          const resultado = await actualizarFoto(reader.result);
          if (resultado.success) {
            Swal.fire({
              icon: "success",
              title: "Foto actualizada",
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: resultado.error || "No se pudo actualizar la foto",
            });
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la foto",
          });
        } finally {
          setGuardando(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    try {
      const resultado = await actualizarPerfil(formPerfil);
      if (resultado.success) {
        setEditando(false);
        Swal.fire({
          icon: "success",
          title: "Perfil actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: resultado.error || "No se pudo actualizar el perfil",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el perfil",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();

    if (formPassword.nueva.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (formPassword.nueva !== formPassword.confirmar) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
      });
      return;
    }

    setGuardando(true);
    try {
      const resultado = await cambiarPassword(
        formPassword.actual,
        formPassword.nueva,
      );

      if (resultado.success) {
        Swal.fire({
          icon: "success",
          title: "Contraseña actualizada",
          text: "Tu contraseña ha sido cambiada exitosamente",
          timer: 2000,
          showConfirmButton: false,
        });
        setFormPassword({ actual: "", nueva: "", confirmar: "" });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: resultado.error || "No se pudo cambiar la contraseña",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cambiar la contraseña",
      });
    } finally {
      setGuardando(false);
    }
  };

  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  if (!usuario) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white">
            Mi Perfil
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Gestiona tu información personal y seguridad
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary-600 to-primary-800 relative">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          </div>

          {/* Avatar y acciones */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-16">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-white dark:bg-neutral-700 border-4 border-white dark:border-neutral-800 shadow-lg overflow-hidden">
                    {usuario.foto ? (
                      <Image
                        src={usuario.foto}
                        alt={usuario.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icons.Shield className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={guardando}
                    className="absolute -bottom-2 -right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50"
                    title="Cambiar foto"
                  >
                    <Icons.Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </div>

                {/* Información básica */}
                <div className="pt-2 sm:pb-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white">
                    {usuario.nombre}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                      Super Administrador
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 text-sm">
                      ID: {usuario.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="flex gap-4 mt-4 sm:mt-0 sm:mb-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-neutral-800 dark:text-white">
                    {formatDate(usuario.fechaRegistro)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Miembro desde
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación de secciones */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-1.5 flex flex-wrap gap-1">
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              onClick={() => setSeccionActiva(seccion.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                seccionActiva === seccion.id
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
            >
              {renderIcon(seccion.icon, "w-4 h-4")}
              {seccion.label}
            </button>
          ))}
        </div>

        {/* Contenido de secciones */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
          {/* Datos Personales */}
          {seccionActiva === "perfil" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
                  <Icons.User className="w-5 h-5 text-primary-600" />
                  Datos Personales
                </h3>
                {!editando ? (
                  <button
                    onClick={() => setEditando(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Icons.Edit className="w-4 h-4" />
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditando(false);
                        setFormPerfil({
                          nombre: usuario.nombre ?? "",
                          telefono: usuario.telefono ?? "",
                          email: usuario.email ?? "",
                        });
                      }}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarPerfil}
                      disabled={guardando}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {guardando ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Icons.CheckCircle className="w-4 h-4" />
                      )}
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Nombre completo
                  </label>
                  {editando ? (
                    <input
                      type="text"
                      value={formPerfil.nombre}
                      onChange={(e) =>
                        setFormPerfil({ ...formPerfil, nombre: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-neutral-800 dark:text-white">
                      {usuario.nombre || "Sin especificar"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Email
                  </label>
                  <p className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-neutral-800 dark:text-white flex items-center gap-2">
                    <Icons.Email className="w-4 h-4 text-neutral-400" />
                    {usuario.email}
                    <span className="ml-auto text-xs text-neutral-500">
                      (no editable)
                    </span>
                  </p>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Teléfono
                  </label>
                  {editando ? (
                    <input
                      type="tel"
                      value={formPerfil.telefono}
                      onChange={(e) =>
                        setFormPerfil({
                          ...formPerfil,
                          telefono: e.target.value,
                        })
                      }
                      placeholder="Ej: 11-1234-5678"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-neutral-800 dark:text-white flex items-center gap-2">
                      <Icons.Phone className="w-4 h-4 text-neutral-400" />
                      {usuario.telefono || "Sin especificar"}
                    </p>
                  )}
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Rol del Sistema
                  </label>
                  <p className="px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-700 dark:text-primary-300 flex items-center gap-2">
                    <Icons.Shield className="w-4 h-4" />
                    Super Administrador
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seguridad */}
          {seccionActiva === "seguridad" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2 mb-6">
                <Icons.Lock className="w-5 h-5 text-primary-600" />
                Cambiar Contraseña
              </h3>

              <div className="max-w-md">
                <form onSubmit={handleCambiarPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={formPassword.actual}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          actual: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={formPassword.nueva}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          nueva: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={formPassword.confirmar}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          confirmar: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Icons.Lock className="w-4 h-4" />
                    )}
                    Cambiar Contraseña
                  </button>
                </form>

                {/* Información de seguridad */}
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Icons.Alert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">
                        Consejos de seguridad
                      </h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1">
                        <li>• Usa una contraseña única para esta cuenta</li>
                        <li>• Combina letras, números y símbolos</li>
                        <li>• No compartas tu contraseña con nadie</li>
                        <li>• Cambia tu contraseña periódicamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actividad */}
          {seccionActiva === "actividad" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2 mb-6">
                <Icons.ChartBar className="w-5 h-5 text-primary-600" />
                Registro de Actividad
              </h3>

              <div className="space-y-4">
                {/* Info de sesión */}
                <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Icons.CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-white">
                          Sesión activa
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Iniciaste sesión hoy
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                      Activa
                    </span>
                  </div>
                </div>

                {/* Permisos del admin */}
                <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-800 dark:text-white mb-3">
                    Permisos de administrador
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Gestionar usuarios", enabled: true },
                      { label: "Ver calificaciones", enabled: true },
                      { label: "Desactivar cuentas", enabled: true },
                      { label: "Eliminar cuentas", enabled: true },
                      { label: "Chat de soporte", enabled: true },
                      { label: "Ver estadísticas", enabled: true },
                    ].map((permiso, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Icons.CheckCircle
                          className={`w-4 h-4 ${
                            permiso.enabled
                              ? "text-green-500"
                              : "text-neutral-400"
                          }`}
                        />
                        <span
                          className={
                            permiso.enabled
                              ? "text-neutral-700 dark:text-neutral-300"
                              : "text-neutral-400"
                          }
                        >
                          {permiso.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información del sistema */}
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icons.Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary-800 dark:text-primary-300">
                        Información del sistema
                      </h4>
                      <p className="text-sm text-primary-700 dark:text-primary-400 mt-1">
                        Eres el administrador principal del sistema. Todas las
                        acciones realizadas en el panel de administración quedan
                        registradas para mantener la seguridad del sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
