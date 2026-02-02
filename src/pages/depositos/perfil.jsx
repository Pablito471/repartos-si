import { useState, useRef } from "react";
import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate, DIAS_SEMANA } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function PerfilDeposito() {
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
    nombre: usuario?.nombre || "",
    telefono: usuario?.telefono || "",
    direccion: usuario?.direccion || "",
    email: usuario?.email || "",
    horarioApertura: usuario?.horarioApertura || "08:00",
    horarioCierre: usuario?.horarioCierre || "18:00",
    diasLaborales: usuario?.diasLaborales || [1, 2, 3, 4, 5], // Lun-Vie por defecto
    descripcion: usuario?.descripcion || "",
  });
  const [formFiscal, setFormFiscal] = useState({
    cuit: usuario?.datosFiscales?.cuit || "",
    condicionIva: usuario?.datosFiscales?.condicionIva || "",
    razonSocial: usuario?.datosFiscales?.razonSocial || "",
    domicilioFiscal: usuario?.datosFiscales?.domicilioFiscal || "",
  });
  const [formPassword, setFormPassword] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const fileInputRef = useRef(null);

  const secciones = [
    { id: "perfil", label: "Datos del Depósito", icon: "🏪" },
    { id: "horarios", label: "Horarios de Atención", icon: "🕒" },
    { id: "fiscal", label: "Datos Fiscales", icon: "📄" },
    { id: "seguridad", label: "Seguridad", icon: "🔒" },
    { id: "eliminar", label: "Eliminar Cuenta", icon: "🗑️" },
  ];

  const condicionesIva = ["Responsable Inscripto", "Monotributista", "Exento"];

  const handleFotoChange = (e) => {
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
      reader.onloadend = () => {
        actualizarFoto(reader.result);
        Swal.fire({
          icon: "success",
          title: "Logo actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = () => {
    actualizarPerfil(formPerfil);
    setEditando(false);
    Swal.fire({
      icon: "success",
      title: "Perfil actualizado",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const guardarDatosFiscales = () => {
    actualizarDatosFiscales(formFiscal);
    Swal.fire({
      icon: "success",
      title: "Datos fiscales actualizados",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleCambiarPassword = (e) => {
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

    const resultado = cambiarPassword(formPassword.actual, formPassword.nueva);

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
  };

  if (!usuario) return null;

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Perfil del Depósito
          </h1>
          <p className="text-gray-600">Gestiona la información de tu negocio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con foto y menú */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card de logo */}
            <div className="card text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  {usuario.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Logo del depósito"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-white">🏪</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors shadow-lg"
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
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Depósito
              </span>
              <p className="text-xs text-gray-400 mt-2">
                Registrado el {formatDate(usuario.fechaRegistro)}
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
                      ? "bg-green-100 text-green-700"
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
            {/* Datos del Depósito */}
            {seccionActiva === "perfil" && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Datos del Depósito
                  </h2>
                  <button
                    onClick={() => setEditando(!editando)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editando
                        ? "bg-gray-200 text-gray-700"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {editando ? "Cancelar" : "✏️ Editar"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Depósito
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del Depósito
                      </label>
                      <p className="p-3 bg-gray-100 rounded-lg font-mono text-gray-500">
                        {usuario.id}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario Apertura
                      </label>
                      {editando ? (
                        <input
                          type="time"
                          value={formPerfil.horarioApertura}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              horarioApertura: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {formPerfil.horarioApertura || "08:00"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario Cierre
                      </label>
                      {editando ? (
                        <input
                          type="time"
                          value={formPerfil.horarioCierre}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              horarioCierre: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {formPerfil.horarioCierre || "18:00"}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción del negocio
                    </label>
                    {editando ? (
                      <textarea
                        value={formPerfil.descripcion}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            descripcion: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        rows={3}
                        placeholder="Describe brevemente tu depósito..."
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {formPerfil.descripcion || "Sin descripción"}
                      </p>
                    )}
                  </div>

                  {editando && (
                    <div className="flex justify-end">
                      <button
                        onClick={guardarPerfil}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        💾 Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Horarios de Atención */}
            {seccionActiva === "horarios" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  🕒 Horarios de Atención
                </h2>

                <div className="space-y-6">
                  {/* Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 text-sm">
                      <strong>ℹ️ Importante:</strong> Los clientes verán si tu
                      depósito está disponible según estos horarios. Configura
                      correctamente tus días y horas de atención.
                    </p>
                  </div>

                  {/* Días laborales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Días de atención
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <button
                          key={dia.id}
                          type="button"
                          onClick={() => {
                            const diasActuales = formPerfil.diasLaborales || [];
                            let nuevosDias;
                            if (diasActuales.includes(dia.id)) {
                              nuevosDias = diasActuales.filter(
                                (d) => d !== dia.id,
                              );
                            } else {
                              nuevosDias = [...diasActuales, dia.id].sort(
                                (a, b) => a - b,
                              );
                            }
                            setFormPerfil({
                              ...formPerfil,
                              diasLaborales: nuevosDias,
                            });
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            (formPerfil.diasLaborales || []).includes(dia.id)
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {dia.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de apertura
                      </label>
                      <input
                        type="time"
                        value={formPerfil.horarioApertura}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            horarioApertura: e.target.value,
                          })
                        }
                        className="input-field w-full text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de cierre
                      </label>
                      <input
                        type="time"
                        value={formPerfil.horarioCierre}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            horarioCierre: e.target.value,
                          })
                        }
                        className="input-field w-full text-lg"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Vista previa para clientes:
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🕐</span>
                      <span className="text-gray-600">
                        {formPerfil.diasLaborales?.length > 0
                          ? `${DIAS_SEMANA.filter((d) =>
                              formPerfil.diasLaborales.includes(d.id),
                            )
                              .map((d) => d.abrev)
                              .join(", ")} `
                          : "Sin días configurados "}
                        {formPerfil.horarioApertura} -{" "}
                        {formPerfil.horarioCierre}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        actualizarPerfil(formPerfil);
                        Swal.fire({
                          icon: "success",
                          title: "Horarios actualizados",
                          timer: 1500,
                          showConfirmButton: false,
                        });
                      }}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      💾 Guardar Horarios
                    </button>
                  </div>
                </div>
              </div>
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
                        placeholder="Razón social de la empresa"
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
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
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
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
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
                    Al eliminar tu cuenta, perderás todos tus datos, inventario,
                    historial de pedidos y configuraciones. No podrás recuperar
                    esta información.
                  </p>
                </div>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "¿Estás seguro?",
                      text: "Esta acción eliminará tu cuenta de depósito permanentemente",
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
    </DepositoLayout>
  );
}
