import { useState, useRef, useEffect } from "react";
import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import DatosPagoQR from "@/components/DatosPagoQR";
import Swal from "sweetalert2";

export default function PerfilCliente() {
  const {
    usuario,
    actualizarPerfil,
    actualizarFoto,
    actualizarDatosFiscales,
    cambiarPassword,
    eliminarCuenta,
  } = useAuth();

  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [editando, setEditando] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    email: "",
  });
  const [formFiscal, setFormFiscal] = useState({
    cuit: "",
    condicionIva: "",
    razonSocial: "",
    domicilioFiscal: "",
  });
  const [formPassword, setFormPassword] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const [guardando, setGuardando] = useState(false);

  const fileInputRef = useRef(null);

  // Cargar datos del usuario cuando cambian
  useEffect(() => {
    if (usuario) {
      setFormPerfil({
        nombre: usuario.nombre || "",
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        email: usuario.email || "",
      });
      setFormFiscal({
        cuit: usuario.datosFiscales?.cuit || "",
        condicionIva: usuario.datosFiscales?.condicionIva || "",
        razonSocial: usuario.datosFiscales?.razonSocial || "",
        domicilioFiscal: usuario.datosFiscales?.domicilioFiscal || "",
      });
    }
  }, [usuario]);

  const secciones = [
    { id: "perfil", label: "Datos Personales", icon: "👤" },
    { id: "pagos", label: "Datos Bancarios", icon: "💳" },
    { id: "fiscal", label: "Datos Fiscales", icon: "📄" },
    { id: "seguridad", label: "Seguridad", icon: "🔒" },
    { id: "eliminar", label: "Eliminar Cuenta", icon: "🗑️" },
  ];

  const condicionesIva = [
    "Responsable Inscripto",
    "Monotributista",
    "Exento",
    "Consumidor Final",
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
        try {
          await actualizarFoto(reader.result);
          Swal.fire({
            icon: "success",
            title: "Foto actualizada",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la foto",
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    try {
      await actualizarPerfil(formPerfil);
      setEditando(false);
      Swal.fire({
        icon: "success",
        title: "Perfil actualizado",
        timer: 1500,
        showConfirmButton: false,
      });
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

  const guardarDatosFiscales = async () => {
    setGuardando(true);
    try {
      await actualizarDatosFiscales(formFiscal);
      Swal.fire({
        icon: "success",
        title: "Datos fiscales actualizados",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron actualizar los datos fiscales",
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
          timer: 1500,
          showConfirmButton: false,
        });
        setFormPassword({ actual: "", nueva: "", confirmar: "" });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: resultado.error,
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

  if (!usuario) return null;

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con foto y menú */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card de foto */}
            <div className="card text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  {usuario.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-white">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                >
                  📷
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">
                {usuario.nombre}
              </h3>
              <p className="text-sm text-gray-500">{usuario.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Cliente
              </span>
              <p className="text-xs text-gray-400 mt-2">
                Miembro desde {formatDate(usuario.fechaRegistro)}
              </p>
            </div>

            {/* Menú de secciones */}
            <div className="card p-2">
              {secciones.map((seccion) => (
                <button
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    seccionActiva === seccion.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{seccion.icon}</span>
                  <span className="font-medium">{seccion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* Datos Personales */}
            {seccionActiva === "perfil" && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Datos Personales
                  </h2>
                  <button
                    onClick={() => setEditando(!editando)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editando
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {editando ? "Cancelar" : "✏️ Editar"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo
                      </label>
                      {editando ? (
                        <input
                          type="text"
                          value={formPerfil.nombre}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              nombre: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="p-3 bg-gray-100 rounded-lg text-gray-500">
                        {usuario.email}
                        <span className="text-xs ml-2">(no editable)</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.telefono || "No especificado"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    {editando ? (
                      <textarea
                        value={formPerfil.direccion}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            direccion: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        rows={2}
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {usuario.direccion || "No especificada"}
                      </p>
                    )}
                  </div>

                  {editando && (
                    <div className="flex justify-end">
                      <button
                        onClick={guardarPerfil}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        💾 Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Datos Bancarios */}
            {seccionActiva === "pagos" && (
              <DatosPagoQR
                usuario={usuario}
                onGuardar={(datosPago) => {
                  actualizarPerfil(datosPago);
                }}
                colorPrimario="blue"
              />
            )}

            {/* Datos Fiscales */}
            {seccionActiva === "fiscal" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Datos Fiscales
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={formFiscal.cuit}
                        onChange={(e) =>
                          setFormFiscal({ ...formFiscal, cuit: e.target.value })
                        }
                        className="input-field w-full"
                        placeholder="XX-XXXXXXXX-X"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condición ante el IVA
                      </label>
                      <select
                        value={formFiscal.condicionIva}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            condicionIva: e.target.value,
                          })
                        }
                        className="input-field w-full"
                      >
                        <option value="">Seleccionar...</option>
                        {condicionesIva.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razón Social
                      </label>
                      <input
                        type="text"
                        value={formFiscal.razonSocial}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            razonSocial: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        placeholder="Nombre o razón social"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domicilio Fiscal
                      </label>
                      <textarea
                        value={formFiscal.domicilioFiscal}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            domicilioFiscal: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        rows={2}
                        placeholder="Dirección fiscal completa"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={guardarDatosFiscales}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      💾 Guardar Datos Fiscales
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seguridad */}
            {seccionActiva === "seguridad" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Cambiar Contraseña
                </h2>

                <form
                  onSubmit={handleCambiarPassword}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    🔒 Cambiar Contraseña
                  </button>
                </form>
              </div>
            )}

            {/* Sección Eliminar Cuenta */}
            {seccionActiva === "eliminar" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-red-600 mb-4">
                  🗑️ Eliminar Cuenta
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 mb-2">
                    <strong>⚠️ Advertencia:</strong> Esta acción es
                    irreversible.
                  </p>
                  <p className="text-red-600 text-sm">
                    Al eliminar tu cuenta, perderás todos tus datos, historial
                    de pedidos y configuraciones. No podrás recuperar esta
                    información.
                  </p>
                </div>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "¿Estás seguro?",
                      text: "Esta acción eliminará tu cuenta permanentemente",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#dc2626",
                      cancelButtonColor: "#6b7280",
                      confirmButtonText: "Sí, eliminar cuenta",
                      cancelButtonText: "Cancelar",
                    }).then((result) => {
                      if (result.isConfirmed) {
                        eliminarCuenta();
                        Swal.fire({
                          icon: "success",
                          title: "Cuenta eliminada",
                          text: "Tu cuenta ha sido eliminada exitosamente",
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      }
                    });
                  }}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  🗑️ Eliminar mi cuenta permanentemente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClienteLayout>
  );
}
